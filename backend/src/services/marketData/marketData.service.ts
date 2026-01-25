import axios from 'axios';
import { stockPriceService } from '../../config/database/redis/redis.service';
import { influxService } from '../../config/database/influx/influx.service';
import ApiError from "../../utils/apiError";

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const API_KEY = process.env.FINNHUB_API_KEY;

if (!API_KEY) {
    console.error("FINNHUB_API_KEY is missing in .env");
}

export const marketDataService = {
    getQuote: async (symbol: string) => {
        const cleanSymbol = symbol.toUpperCase();

        const cachedPrice = await stockPriceService.get(cleanSymbol);
        if (cachedPrice) {
            return { symbol: cleanSymbol, price: cachedPrice, source: 'cache' };
        }

        try {
            const response = await axios.get(`${FINNHUB_BASE_URL}/quote`, {
                params: { symbol: cleanSymbol, token: API_KEY }
            });

            const data = response.data;

            if (!data || data.c === 0) {
                if (data.d === null) {
                    throw new ApiError(404, `Stock symbol ${cleanSymbol} not found`);
                }
            }

            const price = data.c;
            const change = data.d;
            const changePercent = data.dp;

            Promise.all([
                stockPriceService.set(cleanSymbol, price),
                influxService.recordStockPrice(cleanSymbol, price, 0)
            ]).catch(err => console.error('Background update failed:', err));

            return {
                symbol: cleanSymbol,
                price: price,
                change: change,
                changePercent: changePercent,
                high: data.h,
                low: data.l,
                open: data.o,
                prevClose: data.pc,
                source: 'finnhub'
            };

        } catch (error: any) {
            if (error.response?.status === 429) {
                throw new ApiError(429, 'Market data rate limit exceeded. Please try again later.');
            }
            if (error instanceof ApiError) throw error;

            console.error(`Failed to fetch quote for ${cleanSymbol}:`, error.message);
            throw new ApiError(500, 'Failed to retrieve market data');
        }
    },

    getHistory: async (symbol: string, period: '1d' | '1mo' | '1y' = '1mo') => {
        const cleanSymbol = symbol.toUpperCase();

        const influxRange = period === '1d' ? '-1d' : period === '1mo' ? '-30d' : '-365d';

        try {
            const history = await influxService.getHistoricalPrices(cleanSymbol, influxRange);
            if (history && history.length > 0) {
                return { symbol: cleanSymbol, history, source: 'influx' };
            }

            const to = Math.floor(Date.now() / 1000);
            let from = to - (30 * 24 * 60 * 60); // Default 30 days
            let resolution = 'D'; // Daily

            if (period === '1d') {
                from = to - (24 * 60 * 60);
                resolution = '60'; // 60 minutes
            } else if (period === '1y') {
                from = to - (365 * 24 * 60 * 60);
                resolution = 'W'; // Weekly (to save data points)
            }

            const response = await axios.get(`${FINNHUB_BASE_URL}/stock/candle`, {
                params: {
                    symbol: cleanSymbol,
                    resolution: resolution,
                    from: from,
                    to: to,
                    token: API_KEY
                }
            });

            const data = response.data;

            if (data.s === 'no_data') {
                return { symbol: cleanSymbol, history: [], source: 'finnhub' };
            }

            const formattedHistory = data.t.map((timestamp: number, index: number) => ({
                time: new Date(timestamp * 1000), // Convert unix timestamp to JS Date
                price: data.c[index],
                volume: data.v[index],
                high: data.h[index],
                low: data.l[index],
                open: data.o[index]
            }));

            // Optional: Save bulk data to Influx

            return { symbol: cleanSymbol, history: formattedHistory, source: 'finnhub' };

        } catch (error) {
            console.error("History fetch error:", error);
            throw new ApiError(500, 'Failed to retrieve historical data');
        }
    }
};