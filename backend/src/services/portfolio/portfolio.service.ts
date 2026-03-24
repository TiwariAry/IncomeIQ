// portfolio.service.ts

import { marketDataService } from '../marketData/marketData.service';
import { portfolioService as redisPortfolioCache } from '../../config/database/redis/redis.service';
import ApiError from "../../utils/apiError";
import prismaClient from '../../config/database/postgresql/postgresql';

export const portfolioService = {
    createPortfolio: async (userId: string, name: string, initialCapital: number, description?: string, goal?: string) => {
        const portfolio = await prismaClient.portfolio.create({
            data: {
                userId,
                name,
                initialCapital,
                currentValue: initialCapital,
                description,
                goal
            }
        });

        await redisPortfolioCache.invalidate(userId);
        return portfolio;
    },

    getUserPortfolios: async (userId: string) => {
        const cached = await redisPortfolioCache.get(userId);
        if (cached) return cached;

        const portfolios = await prismaClient.portfolio.findMany({
            where: { userId },
            include: {
                holdings: { include: { asset: true } }
            }
        });

        await redisPortfolioCache.set(userId, portfolios);
        return portfolios;
    },

    buyAsset: async (portfolioId: string, ticker: string, quantity: number, userId: string) => {
        const cleanTicker = ticker.toUpperCase();

        let pricePerUnit: number;
        try {
            const quote = await marketDataService.getQuote(cleanTicker);
            pricePerUnit = quote.price;
        } catch (error) {
            console.error(`Market Data Error for ${cleanTicker}:`, error);
            throw new ApiError(400, `Could not fetch live price for ${cleanTicker}. check ticker symbol.`);
        }

        const totalCost = quantity * pricePerUnit;

        // Start Database Transaction
        return prismaClient.$transaction(async (tx) => {
            const portfolio = await tx.portfolio.findUnique({ where: { id: portfolioId } });

            console.log("DEBUG CHECK:");
            console.log(`Portfolio ID: ${portfolioId}`);
            console.log(`Owner ID (DB): ${portfolio?.userId}`);
            console.log(`Request ID (You): ${userId}`);

            if (!portfolio || portfolio.userId !== userId) {
                throw new ApiError(403, "Access denied to this portfolio");
            }

            // Check Cash Balance (currentValue = Cash)
            if (Number(portfolio.currentValue) < totalCost) {
                throw new ApiError(400, `Insufficient funds. Cost: $${totalCost.toFixed(2)}, Cash: $${Number(portfolio.currentValue).toFixed(2)}`);
            }

            // Find or Create Asset
            let asset = await tx.asset.findUnique({ where: { tickerSymbol: cleanTicker } });
            if (!asset) {
                asset = await tx.asset.create({
                    data: {
                        tickerSymbol: cleanTicker,
                        companyName: cleanTicker,
                        assetType: 'STOCK'
                    }
                });
            }

            // Record Transaction
            await tx.transaction.create({
                data: {
                    portfolioId,
                    assetId: asset.id,
                    transactionType: 'BUY',
                    quantity,
                    pricePerUnit,
                    totalAmount: totalCost,
                    transactionDate: new Date()
                }
            });

            // Update Holdings
            const existingHolding = await tx.holding.findUnique({
                where: {
                    portfolioId_assetId: {
                        portfolioId,
                        assetId: asset.id
                    }
                }
            });

            if (existingHolding) {
                const oldTotalVal = Number(existingHolding.quantity) * Number(existingHolding.averagePurchasePrice);
                const newTotalVal = oldTotalVal + totalCost;
                const newQty = Number(existingHolding.quantity) + quantity;
                const newAvg = newTotalVal / newQty;

                await tx.holding.update({
                    where: { id: existingHolding.id },
                    data: {
                        quantity: newQty,
                        averagePurchasePrice: newAvg,
                        totalValue: newQty * pricePerUnit,
                        updatedAt: new Date()
                    }
                });
            } else {
                await tx.holding.create({
                    data: {
                        portfolioId,
                        assetId: asset.id,
                        quantity,
                        averagePurchasePrice: pricePerUnit,
                        currentPrice: pricePerUnit,
                        totalValue: totalCost,
                        unrealizedGainLoss: 0
                    }
                });
            }

            // Deduct Cash
            await tx.portfolio.update({
                where: { id: portfolioId },
                data: {
                    currentValue: { decrement: totalCost },
                    updatedAt: new Date()
                }
            });

            await redisPortfolioCache.invalidate(userId);

            return { message: `Successfully bought ${quantity} shares of ${cleanTicker} at $${pricePerUnit}` };
        });
    },

    getPortfolioSummary: async (portfolioId: string, userId: string) => {
        const portfolio = await prismaClient.portfolio.findUnique({
            where: { id: portfolioId },
            include: {
                holdings: { include: { asset: true } }
            }
        });

        if (!portfolio || portfolio.userId !== userId) {
            throw new ApiError(404, "Portfolio not found");
        }

        let totalHoldingsValue = 0;

        const enrichedHoldings = await Promise.all(portfolio.holdings.map(async (holding) => {
            // ✅ FIX: Use marketDataService here too for reliability
            let currentPrice = Number(holding.currentPrice);
            try {
                const quote = await marketDataService.getQuote(holding.asset.tickerSymbol);
                currentPrice = quote.price;
            } catch (e) {
                // If fetch fails, fallback to last known DB price
            }

            const marketValue = Number(holding.quantity) * currentPrice;
            totalHoldingsValue += marketValue;

            const costBasis = Number(holding.quantity) * Number(holding.averagePurchasePrice);
            const gainLoss = marketValue - costBasis;
            const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

            return {
                ticker: holding.asset.tickerSymbol,
                quantity: Number(holding.quantity),
                avgPrice: Number(holding.averagePurchasePrice),
                currentPrice,
                currentValue: marketValue,
                gainLoss,
                gainLossPercent
            };
        }));

        const cashBalance = Number(portfolio.currentValue);
        const totalEquity = cashBalance + totalHoldingsValue;

        return {
            id: portfolio.id,
            name: portfolio.name,
            cashBalance: cashBalance,
            holdingsValue: totalHoldingsValue,
            totalValue: totalEquity,
            initialCapital: Number(portfolio.initialCapital),
            totalGainLoss: totalEquity - Number(portfolio.initialCapital),
            holdings: enrichedHoldings,
            goal: portfolio.goal || 'Balanced Growth',
        };
    }
};