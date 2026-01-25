import mongoose from 'mongoose';
import { connectDB } from "../../../src/config/database/mongodb/mongodb";
import Analysis from '../../../src/config/database/mongodb/models/Analysis.model';

async function testMongo() {
    console.log('Starting MongoDB Tests...\n');

    try {
        await connectDB();

        const testPortfolioId = "PORT_TEST_" + Date.now();
        const testUserId = "USER_TEST_123";

        console.log(`Creating Analysis Report for: ${testPortfolioId}...`);

        // Create using the REAL Analysis schema
        await Analysis.create({
            portfolioId: testPortfolioId,
            userId: testUserId,
            simulationType: 'MONTE_CARLO',
            status: 'COMPLETED',
            results: {
                projectedValue: 150000,
                riskScore: 7,
                sharpeRatio: 1.45,
                metrics: {
                    volatility: 0.18,
                    beta: 1.15,
                    maxDrawdown: -0.22
                },
                confidenceIntervals: { p10: 120000, p50: 150000, p90: 190000 }
            },
            aiInsights: ["Test Insight 1", "Test Insight 2"]
        });
        console.log('Report saved successfully.');

        // Read back
        const foundReport = await Analysis.findOne({ portfolioId: testPortfolioId });

        if (foundReport && foundReport.status === 'COMPLETED') {
            console.log(`Success! Retrieved Report ID: ${foundReport._id}`);
            console.log(`Stored Beta: ${foundReport.results.metrics?.beta}`);
        } else {
            console.error('Error: Report not found or data mismatch.');
        }

        // Cleanup
        await Analysis.deleteOne({ portfolioId: testPortfolioId });
        console.log('Test data cleaned up.');

    } catch (error) {
        console.error('MongoDB Test Failed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

testMongo();