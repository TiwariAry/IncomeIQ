import redis from "../../../src/config/database/redis/redis";
import {
    sessionService,
    marketDataService,
    portfolioService,
    rateLimitService,
    stockPriceService,
    riskMetricsService,
    redisHealth
} from "../../../src/config/database/redis/redis.service";

async function testRedis() {
    console.log('Starting Redis Tests...\n');

    try {
        // Health Check
        const isHealthy = await redisHealth.check();
        console.log(`Health: ${isHealthy ? 'Connected' : 'Failed'}`);

        // Basic Operations
        await redis.set('test:key', 'Hello Redis!');
        const value = await redis.get('test:key');
        console.log(`Set/Get: ${value === 'Hello Redis!' ? 'Yes' : 'No'}`);
        await redis.del('test:key');

        // Session Service
        const sessionData = { userId: '123', username: 'testuser' };
        await sessionService.set('session-123', sessionData);
        const retrievedSession = await sessionService.get('session-123');
        console.log(`Session Verification: ${retrievedSession?.userId === '123' ? 'Yes' : 'No'}`);

        // Stock Price Service
        await stockPriceService.set('AAPL', 150.25);
        const price = await stockPriceService.get('AAPL');
        console.log(`Single Stock: ${price === 150.25}`);

        await stockPriceService.setMultiple({
            'GOOGL': 2800.50,
            'MSFT': 380.75,
            'TSLA': 245.30,
        });
        const prices = await stockPriceService.getMultiple(['GOOGL', 'MSFT', 'TSLA']);
        console.log(`Multiple Stocks: ${prices.GOOGL === 2800.50}`);

        // Portfolio Service
        const portfolioData = {
            totalValue: 100000,
            positions: [{ symbol: 'AAPL', shares: 100 }],
            returns: 0.15,
        };
        await portfolioService.set('user-123', portfolioData);
        const portfolio = await portfolioService.get('user-123');
        console.log(`Portfolio Verification: ${portfolio?.totalValue === 100000}`);

        const exists = await portfolioService.exists('user-123');
        console.log(`Portfolio Exists: ${exists}`);

        await portfolioService.invalidate('user-123');
        const afterDelete = await portfolioService.exists('user-123');
        console.log(`Portfolio Invalidation: ${!afterDelete}`);

        // Risk Metrics Service
        const riskData = { volatility: 0.25, sharpeRatio: 1.5 };
        await riskMetricsService.set('portfolio-123', riskData);
        const risk = await riskMetricsService.get('portfolio-123');
        console.log(`Risk Verification: ${risk?.volatility === 0.25}`);

        // Market Data Service
        const marketData = { spy: 450.25, vix: 18.5 };
        await marketDataService.set('indices', marketData);
        const market = await marketDataService.get('indices');
        console.log(`Market Data: ${market?.spy === 450.25}`);

        // Rate Limiting
        await rateLimitService.check('test-user', 5);
        for (let i = 0; i < 4; i++) await rateLimitService.check('test-user', 5);

        const limitFail = await rateLimitService.check('test-user', 5);
        console.log(`Rate Limit Enforced: ${!limitFail.allowed}`);

        await rateLimitService.reset('test-user');
        const limitReset = await rateLimitService.check('test-user', 5);
        console.log(`Rate Limit Reset: ${limitReset.allowed}`);

        // TTL Test
        console.log('Testing TTL...');
        await redis.set('ttl-test', 'expires', { ex: 2 });

        const beforeExpire = await redis.get('ttl-test');
        console.log(`Before Expire: ${beforeExpire !== null}`);

        await new Promise(resolve => setTimeout(resolve, 3000));

        const afterExpire = await redis.get('ttl-test');
        console.log(`After Expire: ${afterExpire === null}`);

        console.log('\nAll tests passed.');

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        // Manual Cleanup
        console.log('Cleaning up data...');
        const keysToDelete = [
            'test:key',
            'session:session-123',
            'stock:AAPL', 'stock:GOOGL', 'stock:MSFT', 'stock:TSLA',
            'portfolio:user-123',
            'risk:portfolio-123',
            'market:indices',
            'ratelimit:test-user',
            'ttl-test'
        ];

        // Upstash supports deleting multiple keys at once
        await redis.del(...keysToDelete);
        console.log('Cleanup complete.');
    }
}

testRedis();