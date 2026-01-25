import redis from './redis'

export const TTL = {
    SESSION: 60 * 60 * 24 * 7, // 7 days
    STOCK_PRICE: 60, // 1 minute
    PORTFOLIO: 60 * 5, // 5 minutes
    RISK_METRICS: 60 * 15, // 15 minutes
    MARKET_DATA: 60 * 5, // 5 minutes
    RATE_LIMIT: 60 * 60, // 1 hour
} as const;

// Session Storage
export const sessionService = {
    set: async (sessionId: string, data: any): Promise<void> => {
        await redis.set(`session:${sessionId}`, data, { ex: TTL.SESSION });
    },

    get: async (sessionId: string): Promise<any | null> => {
        return await redis.get(`session:${sessionId}`);
    },

    delete: async (sessionId: string): Promise<void> => {
        await redis.del(`session:${sessionId}`);
    },

    refresh: async (sessionId: string): Promise<void> => {
        await redis.expire(`session:${sessionId}`, TTL.SESSION);
    },
};

// Stock Prices Cache
export const stockPriceService = {
    set: async (symbol: string, price: number): Promise<void> => {
        await redis.set(`stock:${symbol}`, price, { ex: TTL.STOCK_PRICE });
    },

    get: async (symbol: string): Promise<number | null> => {
        const price = await redis.get<number>(`stock:${symbol}`);
        return price !== null ? Number(price) : null;
    },

    setMultiple: async (prices: Record<string, number>): Promise<void> => {
        const pipeline = redis.pipeline();
        Object.entries(prices).forEach(([symbol, price]) => {
            pipeline.set(`stock:${symbol}`, price, { ex: TTL.STOCK_PRICE });
        });
        await pipeline.exec();
    },

    getMultiple: async (symbols: string[]): Promise<Record<string, number | null>> => {
        const pipeline = redis.pipeline();
        symbols.forEach(symbol => pipeline.get(`stock:${symbol}`));

        const results = await pipeline.exec<number[]>();

        const prices: Record<string, number | null> = {};
        symbols.forEach((symbol, index) => {
            const value = results[index];
            prices[symbol] = value !== null ? Number(value) : null;
        });

        return prices;
    },
};

// Portfolio Calculations Cache
export const portfolioService = {
    set: async (userId: string, data: any): Promise<void> => {
        await redis.set(`portfolio:${userId}`, data, { ex: TTL.PORTFOLIO });
    },

    get: async (userId: string): Promise<any | null> => {
        return await redis.get(`portfolio:${userId}`);
    },

    invalidate: async (userId: string): Promise<void> => {
        await redis.del(`portfolio:${userId}`);
    },

    exists: async (userId: string): Promise<boolean> => {
        const result = await redis.exists(`portfolio:${userId}`);
        return result === 1;
    },
};

// Risk Metrics Cache
export const riskMetricsService = {
    set: async (portfolioId: string, metrics: any): Promise<void> => {
        await redis.set(`risk:${portfolioId}`, metrics, { ex: TTL.RISK_METRICS });
    },

    get: async (portfolioId: string): Promise<any | null> => {
        return await redis.get(`risk:${portfolioId}`);
    },

    invalidate: async (portfolioId: string): Promise<void> => {
        await redis.del(`risk:${portfolioId}`);
    },
};

// Market Data Cache
export const marketDataService = {
    set: async (key: string, data: any, customTTL?: number): Promise<void> => {
        const ttl = customTTL || TTL.MARKET_DATA;
        await redis.set(`market:${key}`, data, { ex: ttl });
    },

    get: async (key: string): Promise<any | null> => {
        return await redis.get(`market:${key}`);
    },

    invalidate: async (key: string): Promise<void> => {
        await redis.del(`market:${key}`);
    },

    invalidatePattern: async (pattern: string): Promise<void> => {
        const keys = await redis.keys(`market:${pattern}`);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    },
};

// Rate Limiting
export const rateLimitService = {
    check: async (key: string, limit: number = 100): Promise<{ allowed: boolean; remaining: number }> => {
        const current = await redis.incr(`ratelimit:${key}`);

        if (current === 1) {
            await redis.expire(`ratelimit:${key}`, TTL.RATE_LIMIT);
        }

        const allowed = current <= limit;
        const remaining = Math.max(0, limit - current);

        return { allowed, remaining };
    },

    getCount: async (key: string): Promise<number> => {
        const count = await redis.get<number>(`ratelimit:${key}`);
        return count ? Number(count) : 0;
    },

    reset: async (key: string): Promise<void> => {
        await redis.del(`ratelimit:${key}`);
    },
};

// Health check
export const redisHealth = {
    check: async (): Promise<boolean> => {
        try {
            await redis.set('health-check', 'OK');
            const result = await redis.get('health-check');
            await redis.del('health-check');
            return result === 'OK';
        } catch (error) {
            console.error('Redis health check failed:', error);
            return false;
        }
    },
};