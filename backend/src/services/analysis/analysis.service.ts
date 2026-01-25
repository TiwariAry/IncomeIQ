import { portfolioService } from '../portfolio/portfolio.service'
import ApiError from "../../utils/apiError";
import Analysis from "../../config/database/mongodb/models/Analysis.model";

export const analysisService = {
    /* Risk Assessment + Monte Carlo + Strategy explainer */
    runSimulation: async (portfolioId: string, userId: string) => {
        const portfolio = await portfolioService.getPortfolioSummary(portfolioId, userId);

        if (!portfolio.holdings || portfolio.holdings.length === 0) {
            throw new ApiError(400, "Cannot analyze empty portfolio. Buy assets first.");
        }

        // Math simulation (Replace by AI)
        const volatility = 0.18; // 18% Standard Deviation
        const beta = 1.15;       // Market sensitivity
        const maxDrawdown = -0.22; // -22% worst case drop

        // Monte Carlo Projections
        const currentVal = portfolio.totalValue;
        const drift = 0.08; // 8% annual growth

        const p50 = currentVal * Math.pow(1 + drift, 5); // Expected
        const p10 = p50 * (1 - volatility * 2); // Bear Case (90% confidence)
        const p90 = p50 * (1 + volatility * 2); // Bull Case

        // 4. Strategy Explainer
        const insights = [
            `Risk Profile: ${beta > 1 ? 'Aggressive' : 'Conservative'} (Beta: ${beta})`,
            `Projected 5-Year Upside: $${(p90 - currentVal).toFixed(2)}`,
            `Diversification: ${portfolio.holdings.length > 5 ? 'High' : 'Moderate'}`,
            `Primary Exposure: ${portfolio.holdings[0].ticker} accounts for significant weight.`
        ];

        return await Analysis.create({
            portfolioId,
            userId,
            simulationType: 'MONTE_CARLO',
            status: 'COMPLETED',
            results: {
                projectedValue: Math.floor(p50),
                riskScore: Math.floor(beta * 5), // Scale 1-10
                sharpeRatio: 1.4,
                metrics: {
                    volatility,
                    beta,
                    maxDrawdown
                },
                confidenceIntervals: { p10, p50, p90 },
                simulatedPaths: []
            },
            aiInsights: insights
        })
    },

    /* Compare Strategies */
    compareStrategies: async (portfolioIdA: string, portfolioIdB: string, userId: string) => {
        const reportA = await Analysis.findOne({ portfolioId: portfolioIdA }).sort({ createdAt: -1 });
        const reportB = await Analysis.findOne({ portfolioId: portfolioIdB }).sort({ createdAt: -1 });

        if (!reportA || !reportB) {
            throw new ApiError(404, "Analysis report missing for one or both portfolios. Run simulation first.");
        }

        return {
            comparison: {
                portfolioA: {
                    id: portfolioIdA,
                    return: reportA.results.projectedValue,
                    risk: reportA.results.riskScore,
                    sharpe: reportA.results.sharpeRatio
                },
                portfolioB: {
                    id: portfolioIdB,
                    return: reportB.results.projectedValue,
                    risk: reportB.results.riskScore,
                    sharpe: reportB.results.sharpeRatio
                },
                verdict: reportA.results.sharpeRatio > reportB.results.sharpeRatio
                    ? "Portfolio A is more efficient (higher return per unit of risk)."
                    : "Portfolio B is more efficient."
            }
        };
    },

    /* Stress Test */
    runStressTest: async (portfolioId: string, userId: string) => {
        const portfolio = await portfolioService.getPortfolioSummary(portfolioId, userId);
        const totalValue = portfolio.totalValue;

        // Standard crash scenarios
        const scenarios = [
            { name: "2008 Financial Crisis", drop: -0.50 },
            { name: "COVID-19 Crash (2020)", drop: -0.34 },
            { name: "Tech Bubble Burst", drop: -0.70 },
            { name: "Moderate Correction", drop: -0.10 }
        ];

        const results = scenarios.map(scenario => {
            const stressValue = totalValue * (1 + scenario.drop);
            const loss = totalValue - stressValue;

            return {
                scenario: scenario.name,
                originalValue: totalValue,
                stressedValue: stressValue,
                lossAmount: loss,
                survived: stressValue > (totalValue * 0.5) // "Survived" if > 50% capital remains
            };
        });

        return { portfolioId, stressTests: results };
    },

    getAnalysisHistory: async (portfolioId: string) => {
        return await Analysis.find({ portfolioId }).sort({ createdAt: -1 });
    }
};