// @ts-ignore
import request from 'supertest';
import app from '../../../src/app';
import { stockPriceService } from '../../../src/config/database/redis/redis.service';
import redis from '../../../src/config/database/redis/redis';
import prismaClient from '../../../src/config/database/postgresql/postgresql';

function assert(condition: boolean, message: string) {
    if (condition) {
        console.log(`PASS: ${message}`);
    } else {
        console.error(`FAIL: ${message}`);
        throw new Error(message);
    }
}

async function testPortfolioCalculation() {
    console.log('Starting Portfolio Calculation Integration Test...\n');

    let token: string = '';
    let userId: string = '';
    let portfolioId: string = '';
    const TEST_TICKER = 'AAPL';
    const TEST_QTY = 5;
    const MOCK_PRICE = 248.04;

    try {
        // 1. Login
        console.log('1. Authenticating...');
        let loginRes = await request(app).post('/api/v1/auth/login').send({
            email: 'test_user_mongo@incomeiq.com',
            password: 'password123'
        });

        if (loginRes.statusCode !== 200) {
            const regRes = await request(app).post('/api/v1/auth/register').send({
                email: 'port_calc_test@example.com',
                password: 'password123',
                firstName: 'Calc',
                lastName: 'Test'
            });
            token = regRes.body.data.accessToken;
            userId = regRes.body.data.user.id;
        } else {
            token = loginRes.body.data.accessToken;
            userId = loginRes.body.data.user.id;
        }
        assert(!!token, 'Authentication successful');

        // 2. Create Portfolio
        console.log('\n2. Creating Portfolio...');
        const createRes = await request(app)
            .post('/api/v1/portfolio')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Growth Fund Test',
                description: 'Integration test portfolio',
                initialCapital: 10000.00
            });

        assert(createRes.statusCode === 201, 'Portfolio created');
        portfolioId = createRes.body.data.id;

        // 3. Buy Asset
        console.log(`\n3. Buying ${TEST_QTY} shares of ${TEST_TICKER}...`);

        // Inject price to avoid external API calls in test
        await stockPriceService.set(TEST_TICKER, MOCK_PRICE);

        const buyRes = await request(app)
            .post(`/api/v1/portfolio/${portfolioId}/buy`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                ticker: TEST_TICKER,
                quantity: TEST_QTY
            });

        assert(buyRes.statusCode === 200, 'Buy order executed');

        // 4. Verify Calculations (Single Portfolio)
        console.log('\n4. Verifying Portfolio Summary...');
        const summaryRes = await request(app)
            .get(`/api/v1/portfolio/${portfolioId}`)
            .set('Authorization', `Bearer ${token}`);

        const portfolio = summaryRes.body.data;
        const holdings = portfolio.holdings;
        const remainingCash = Number(portfolio.currentValue || portfolio.cashBalance);

        const appleHolding = holdings.find((h: any) => h.ticker === TEST_TICKER || h.symbol === TEST_TICKER);
        assert(!!appleHolding, 'Asset found in holdings');
        assert(Number(appleHolding.quantity) === TEST_QTY, 'Quantity matches');

        const expectedCost = MOCK_PRICE * TEST_QTY;
        const cashDiff = 10000 - remainingCash;
        const isCorrect = Math.abs(cashDiff - expectedCost) < 0.5;
        assert(isCorrect, 'Cash deduction matches asset cost');

        // 5. Check Cache
        console.log('\n5. Checking Cache...');

        // Call 'Get All Portfolios' to populate the cache
        // The 'buy' action deleted the cache
        await request(app)
            .get('/api/v1/portfolio')
            .set('Authorization', `Bearer ${token}`);

        // Now check if Redis has the data
        const cachedSummary = await redis.get(`portfolio:${userId}`);

        if (!cachedSummary) {
            console.error(`Debug: userId used for cache key: portfolio:${userId}`);
        }

        assert(!!cachedSummary, 'Portfolio list successfully cached in Redis');
        console.log('   Redis Cache Hit: YES');

        console.log('\nAll Calculation Tests Passed.');

    } catch (error) {
        console.error('\nTest Failed:', error);
    } finally {
        console.log('\nCleaning up...');
        if (portfolioId) {
            try {
                await prismaClient.transaction.deleteMany({ where: { portfolioId } });
                await prismaClient.holding.deleteMany({ where: { portfolioId } });
                await prismaClient.portfolio.delete({ where: { id: portfolioId } });
            } catch (e) {}
            await redis.del(`portfolio:${userId}`);
            await redis.del(`stock:${TEST_TICKER}`);
        }
        await prismaClient.$disconnect();
        process.exit(0);
    }
}

testPortfolioCalculation();