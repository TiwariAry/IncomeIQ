// @ts-ignore
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../../src/app';

const prisma = new PrismaClient();

function assert(condition: boolean, message: string) {
    if (condition) {
        console.log(`PASS: ${message}`);
    } else {
        console.error(`FAIL: ${message}`);
        throw new Error(message);
    }
}

async function testSessionManagement() {
    console.log('Starting Session Management (Redis) Test...\n');
    let token: string = '';
    const TEST_EMAIL = 'session_test@example.com';
    const TEST_PASS = 'password123';

    try {
        // 0. CLEANUP
        // Delete the user if they exist so we can register fresh
        console.log('0. Cleaning up old test data...');
        await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });

        // 1. Register
        console.log('1. Registering User...');
        const regRes = await request(app).post('/api/v1/auth/register').send({
            email: TEST_EMAIL,
            password: TEST_PASS,
            firstName: 'Session',
            lastName: 'Test'
        });

        if (regRes.statusCode === 201) {
            token = regRes.body.data.accessToken;
        } else {
            // Fallback
            const loginRes = await request(app).post('/api/v1/auth/login').send({
                email: TEST_EMAIL,
                password: TEST_PASS
            });
            token = loginRes.body.data.accessToken;
        }

        assert(!!token, 'Received Access Token');


        // 2. Verify Access
        console.log('\n2. Testing Access with Valid Session...');
        const accessRes = await request(app)
            .get('/api/v1/portfolio')
            .set('Authorization', `Bearer ${token}`);

        assert(accessRes.statusCode === 200, 'Access Granted (200 OK)');


        // 3. Logout
        console.log('\n3. Logging Out...');
        const logoutRes = await request(app)
            .post('/api/v1/auth/logout')
            .set('Authorization', `Bearer ${token}`);

        assert(logoutRes.statusCode === 200, 'Logout Successful');


        // 4. Verify Block (Redis Should Deny)
        console.log('\n4. Testing Access AFTER Logout (Expect 401)...');
        const blockedRes = await request(app)
            .get('/api/v1/portfolio')
            .set('Authorization', `Bearer ${token}`); // Using the SAME token

        console.log(`   Status Code: ${blockedRes.statusCode}`);
        assert(blockedRes.statusCode === 401, 'Access Denied (401 Unauthorized)');


        console.log('\nAll tests passed!');

    } catch (error) {
        console.error('\nTest Failed:', error);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

testSessionManagement();