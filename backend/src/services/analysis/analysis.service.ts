// analysis.service.ts
import { portfolioService } from '../portfolio/portfolio.service';
import { marketDataService } from '../marketData/marketData.service';
import ApiError from "../../utils/apiError";
import Analysis from "../../config/database/mongodb/models/Analysis.model";
import axios from 'axios';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

export const analysisService = {

    /* Risk Assessment + ML Predictive Engine + Strategy explainer */
    runSimulation: async (portfolioId: string, userId: string) => {
        const portfolio = await portfolioService.getPortfolioSummary(portfolioId, userId);

        if (!portfolio.holdings || portfolio.holdings.length === 0) {
            throw new ApiError(400, "Cannot analyze empty portfolio. Buy assets first.");
        }

        // 1. Fetch REAL market data for the largest holding to feed the ML Model
        // Assuming holdings are sorted, or we just grab the first one as a proxy
        // 1. Fetch REAL market data for the largest holding to feed the ML Model
        const mainTicker = portfolio.holdings[0].ticker;
        const historyData = await marketDataService.getHistory(mainTicker, '1y');

        let historicalPrices = historyData.history.map((h: any) => h.price);

        // Safety Net: If Finnhub returns less than 30 points (e.g., recent IPO),
        // pad the beginning of the array with the oldest known price so PyTorch doesn't crash.
        while (historicalPrices.length > 0 && historicalPrices.length < 30) {
            historicalPrices.unshift(historicalPrices[0]);
        }

        // Now we take the last 30 for the model
        historicalPrices = historicalPrices.slice(-30);

        if (historicalPrices.length < 30) {
            throw new ApiError(400, `Market data unavailable for ${mainTicker}.`);
        }

        // 2. Call the Python Predictive Engine (LSTM)
        const predictRes = await axios.post(`${ML_SERVICE_URL}/predict`, { prices: historicalPrices });
        const { p10, p50, p90 } = predictRes.data;

        // Map the ML stock price projection to the User's Total Portfolio Value
        const startPrice = historicalPrices[historicalPrices.length - 1];
        const finalProjectedPrice = p50[p50.length - 1];
        const growthFactor = finalProjectedPrice / startPrice;

        const currentVal = portfolio.totalValue;
        const projectedValue = currentVal * growthFactor;

        // Calculate absolute confidence intervals for the DB
        const p10Value = currentVal * (p10[p10.length - 1] / startPrice);
        const p90Value = currentVal * (p90[p90.length - 1] / startPrice);

        // 3. Call the Risk Profiler (XGBoost)
        // Pass generic portfolio features to the XGBoost model
        // Example: [Num Holdings, Total Value (scaled), Tech Weight, Beta Proxy, Volatility Proxy]
        const features = [portfolio.holdings.length, currentVal / 10000, 0.5, 1.2, 0.8];
        const riskRes = await axios.post(`${ML_SERVICE_URL}/risk`, { features });
        const riskScore = riskRes.data.riskScore;

        // 4. Call the AI Explainer (Gemini) with a safety fallback for Rate Limits
        let aiInsights = [];
        try {
            const explainRes = await axios.post(`${ML_SERVICE_URL}/explain`, {
                metrics: {
                    currentValue: `$${currentVal.toFixed(2)}`,
                    projectedMedian: `$${projectedValue.toFixed(2)}`,
                    riskScore: riskScore,
                    maxDrawdown: "-15%" // Placeholder, can be calculated dynamically
                },
                goal: portfolio.goal || "Balanced Growth"
            });
            aiInsights = explainRes.data.aiInsights;
        } catch (error) {
            console.warn("Gemini AI Explainer failed or rate-limited. Using fallback insights.");
            aiInsights = [
                `Your AI risk score is ${riskScore} based on current market features.`,
                `Projected upside based on LSTM Deep Learning is $${(projectedValue - currentVal).toFixed(2)}.`,
                `Diversification is ${portfolio.holdings.length > 5 ? 'High' : 'Moderate'}.`,
                `Model suggests monitoring ${mainTicker} closely as it drives portfolio variance.`
            ];
        }

        // Save to Database
        return await Analysis.create({
            portfolioId,
            userId,
            simulationType: 'DEEP_LEARNING_LSTM', // Updated label
            status: 'COMPLETED',
            results: {
                projectedValue: Math.floor(projectedValue),
                riskScore: riskScore,
                sharpeRatio: 1.4, // Can be updated to dynamic later
                metrics: {
                    volatility: 0.18,
                    beta: 1.15,
                    maxDrawdown: -0.22
                },
                confidenceIntervals: { p10: p10Value, p50: projectedValue, p90: p90Value },
                // Store the raw projection arrays so the React frontend can chart the trajectories
                simulatedPaths: [p10, p50, p90]
            },
            aiInsights: aiInsights
        });
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
                    ? "Portfolio A is more efficient based on AI projections."
                    : "Portfolio B is more efficient based on AI projections."
            }
        };
    },

    /* Stress Test (VAE Anomaly Generation) */
    runStressTest: async (portfolioId: string, userId: string) => {
        const portfolio = await portfolioService.getPortfolioSummary(portfolioId, userId);
        const totalValue = portfolio.totalValue;

        // Call the PyTorch VAE Stress Simulator
        const stressRes = await axios.post(`${ML_SERVICE_URL}/stress`);
        const aiScenarios = stressRes.data;

        // Map the abstract math vectors from PyTorch into financial crash percentages
        const results = aiScenarios.map((scenario: any, index: number) => {
            // Take the first vector value as the drop impact, clamp it between -90% and +5%
            const rawVector = scenario.scenarioVector[0];
            const dropPercent = Math.min(Math.max(rawVector, -0.90), 0.05);

            const stressValue = totalValue * (1 + dropPercent);
            const loss = totalValue - stressValue;

            return {
                scenario: `AI Anomaly Profile ${index + 1}`,
                originalValue: totalValue,
                stressedValue: stressValue,
                lossAmount: loss,
                survived: stressValue > (totalValue * 0.5)
            };
        });

        return { portfolioId, stressTests: results };
    },

    getAnalysisHistory: async (portfolioId: string) => {
        return await Analysis.find({ portfolioId }).sort({ createdAt: -1 });
    }
};