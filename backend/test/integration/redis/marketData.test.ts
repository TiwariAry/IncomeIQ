// @ts-ignore
import request from 'supertest'
import app from '../../../src/app';
import redis from '../../../src/config/database/redis/redis';

// Helper for assertions
function assert(condition: boolean, message: string) {
    if (condition) {
        console.log(`${message}`);
    } else {
        console.error(`Failed: ${message}`);
        throw new Error(message);
    }
}

async function testMarketCache() {
    console.log('Starting Market Data Cache Integration Test...\n');
    const TEST_SYMBOL = 'NFLX'; // Netflix
    let token: string = '';

    try {
        console.log('1. Logging in...');
        const loginRes = await request(app).post('/api/v1/auth/login').send({
            email: 'test_user@example.com',
            password: 'SecurePassword123!'
        });

        // Fallback
        if (loginRes.statusCode !== 200) {
            console.log('   Login failed, registering new test user...');
            const regRes = await request(app).post('/api/v1/auth/register').send({
                email: 'test_user@example.com',
                password: 'SecurePassword123!',
                firstName: 'Alice',
                lastName: 'Wonderland'
            });
            token = regRes.body.data.accessToken;
        } else {
            token = loginRes.body.data.accessToken;
        }
        console.log('   Login successful.\n');

        await redis.del(`stock:${TEST_SYMBOL}`);
        console.log(`2. Cleared cache for ${TEST_SYMBOL}.\n`);


        // 3. Test 1: First Request (Should hit API)
        console.log('3. First Request (Expecting FINNHUB)...');
        const start1 = Date.now();
        const res1 = await request(app)
            .get(`/api/v1/market/quote/${TEST_SYMBOL}`)
            .set('Authorization', `Bearer ${token}`);
        const time1 = Date.now() - start1;

        assert(res1.statusCode === 200, 'Status code is 200');
        assert(res1.body.data.source === 'finnhub', `Source should be 'finnhub'. Got: ${res1.body.data.source}`);
        console.log(`   ⏱️  Time taken: ${time1}ms\n`);


        // 4. Test 2: Second Request (Should hit Redis)
        console.log('4. Second Request (Expecting CACHE)...');
        const start2 = Date.now();
        const res2 = await request(app)
            .get(`/api/v1/market/quote/${TEST_SYMBOL}`)
            .set('Authorization', `Bearer ${token}`);
        const time2 = Date.now() - start2;

        assert(res2.statusCode === 200, 'Status code is 200');
        assert(res2.body.data.source === 'cache', `Source should be 'cache'. Got: ${res2.body.data.source}`);

        // Value check
        assert(res2.body.data.price === res1.body.data.price, 'Price matches original fetch');
        console.log(`   ⏱️  Time taken: ${time2}ms (Should be faster)\n`);


        console.log('All Integration Tests Passed!');

    } catch (error) {
        console.error('\nTest Failed:', error);
    } finally {
        console.log('\nCleaning up...');
        await redis.del(`stock:${TEST_SYMBOL}`);
        // Close Redis connection to allow script to exit
        process.exit(0);
    }
}

testMarketCache();