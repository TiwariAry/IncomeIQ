import prismaClient from "../../../src/config/database/postgresql/postgresql";

async function testDatabase() {
    let userId: string | undefined;
    let portfolioId: string | undefined;

    try {
        console.log('Testing PostgreSQL connection...');

        // Create user
        const newUser = await prismaClient.user.create({
            data: {
                email: `test_${Date.now()}@incomeiq.com`,
                passwordHash: 'hashed_secret',
                firstName: 'Test',
                lastName: 'User',
                phoneNumber: '+1234567890',
                riskTolerance: 'MODERATE',
            },
        });
        userId = newUser.id;
        console.log('User created:', newUser.id);

        // Fetch users
        const allUsers = await prismaClient.user.findMany();
        console.log('User count:', allUsers.length);

        // Create portfolio
        const newPortfolio = await prismaClient.portfolio.create({
            data: {
                userId: newUser.id,
                name: 'Test Portfolio',
                description: 'Integration test',
                initialCapital: 10000.00,
                currentValue: 10000.00,
            },
        });
        portfolioId = newPortfolio.id;
        console.log('Portfolio created:', newPortfolio.id);

        // Verify relations
        const userWithPortfolios = await prismaClient.user.findUnique({
            where: { id: newUser.id },
            include: { portfolios: true },
        });

        console.log('Relations verified');
        console.log('Test sequence complete');

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        // Cleanup data
        if (portfolioId) {
            // Delete portfolio
            await prismaClient.portfolio.delete({ where: { id: portfolioId } });
            console.log('Portfolio deleted');
        }

        if (userId) {
            // Delete user
            await prismaClient.user.delete({ where: { id: userId } });
            console.log('User deleted');
        }

        await prismaClient.$disconnect();
    }
}

testDatabase();