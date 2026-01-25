import { PrismaClient } from '@prisma/client';

const prismaClient = new PrismaClient({
    log: ['query', 'error', 'warn'],
});

process.on('SIGINT', async () => {
    await prismaClient.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await prismaClient.$disconnect();
    process.exit(0);
});

export default prismaClient;