// marketData.service.ts
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
            throw new ApiError(500, 'Failed to retrieve market data');
        }
    },

    getHistory: async (symbol: string, period: '1d' | '1mo' | '1y' = '1mo') => {
        const cleanSymbol = symbol.toUpperCase();
        const influxRange = period === '1d' ? '-1d' : period === '1mo' ? '-30d' : '-365d';

        // 1. Try InfluxDB Safely
        try {
            const history = await influxService.getHistoricalPrices(cleanSymbol, influxRange);
            if (history && history.length >= 30) {
                return { symbol: cleanSymbol, history, source: 'influx' };
            }
        } catch (err: any) {
            console.warn(`[Warning] InfluxDB fetch skipped for ${cleanSymbol}`);
        }

        // 2. Try Finnhub Safely (Forced to Daily resolution for free tier)
        try {
            const to = Math.floor(Date.now() / 1000);
            const from = to - (365 * 24 * 60 * 60); // Grab 1 year of data just to be safe

            // We force 'D' (Daily) here because Finnhub blocks 'W' (Weekly) for free users on candle data
            const response = await axios.get(`${FINNHUB_BASE_URL}/stock/candle`, {
                params: { symbol: cleanSymbol, resolution: 'D', from, to, token: API_KEY }
            });

            const data = response.data;

            // Ensure Finnhub actually returned enough valid data
            if (data.s === 'ok' && data.c && data.c.length >= 30) {
                const formattedHistory = data.t.map((timestamp: number, index: number) => ({
                    time: new Date(timestamp * 1000),
                    price: data.c[index]
                }));
                return { symbol: cleanSymbol, history: formattedHistory, source: 'finnhub' };
            }
        } catch (err: any) {
            console.warn(`[Warning] Finnhub returned ${err.response?.status} for ${cleanSymbol}. Defaulting to synthetic data.`);
        }

        // 3. The Ultimate Demo Fallback (Guarantees the AI Pipeline NEVER crashes)
        console.warn(`[Notice] Generating synthetic data for ${cleanSymbol} to feed PyTorch models.`);

        // Grab the last known quote to make the synthetic data realistic
        let basePrice = 150;
        try {
            const quote = await marketDataService.getQuote(cleanSymbol);
            basePrice = quote.price;
        } catch (e) {} // Ignore quote errors for fallback

        const syntheticHistory = Array.from({ length: 30 }, (_, i) => {
            basePrice = basePrice * (1 + (Math.random() * 0.04 - 0.02)); // Random +/- 2% daily drift
            return { time: new Date(), price: basePrice };
        });

        // NOTICE: There are absolutely no "throw new Error" statements here.
        // It will ALWAYS return data.
        return { symbol: cleanSymbol, history: syntheticHistory, source: 'synthetic_fallback' };
    }
};