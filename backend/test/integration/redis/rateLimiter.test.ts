// @ts-ignore
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../../src/app';
import redis from '../../../src/config/database/redis/redis';

const prisma = new PrismaClient();

async function testSafeRateLimit() {
    console.log('Starting Zero-Cost Rate Limit Test...\n');
    const TEST_EMAIL = 'ratelimit_test@example.com';
    const TEST_PASS = 'password123';
    let token = '';
    let userId = '';

    try {
        // 1. Setup User
        let loginRes = await request(app).post('/api/v1/auth/login').send({
            email: TEST_EMAIL,
            password: TEST_PASS
        });

        if (loginRes.statusCode !== 200) {
            // Cleanup
            await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });

            const regRes = await request(app).post('/api/v1/auth/register').send({
                email: TEST_EMAIL,
                password: TEST_PASS,
                firstName: 'Rate',
                lastName: 'Test'
            });
            token = regRes.body.data.accessToken;
            userId = regRes.body.data.user.id;
        } else {
            token = loginRes.body.data.accessToken;
            userId = loginRes.body.data.user.id;
        }

        console.log('1. User Authenticated.');

        // 2. Manually fill the Rate Limit bucket in Redis
        const redisKey = `ratelimit:market:${userId}`;

        await redis.set(redisKey, 11, { ex: 60 }); // Set to 11 (Limit + 1) to force immediate block

        console.log(`2. Manually injected limit count (11) into Redis key: ${redisKey}`);
        console.log('   (This simulates spamming without actually making API calls)\n');


        // 3. Make ONE Request
        // The middleware should see the '11' in Redis and block instantly.
        console.log('3. Attempting Market Data Request...');
        const res = await request(app)
            .get('/api/v1/market/quote/AAPL')
            .set('Authorization', `Bearer ${token}`);

        // 4. Verify Block
        if (res.statusCode === 429) {
            console.log('PASS: Request blocked with 429 Too Many Requests.');
            console.log(`Headers: X-RateLimit-Limit: ${res.headers['x-ratelimit-limit']}`);
            console.log(`Headers: X-RateLimit-Remaining: ${res.headers['x-ratelimit-remaining']}`);
        } else {
            console.error(`FAIL: Request was NOT blocked. Status: ${res.statusCode}`);
            console.error('Ensure your middleware namespace matches the Redis key.');
        }

    } catch (error) {
        console.error('\nTest Failed:', error);
    } finally {
        // Remove the fake limit
        if (userId) {
            await redis.del(`ratelimit:market:${userId}`);
        }
        await prisma.$disconnect();
        process.exit(0);
    }
}

testSafeRateLimit();