import { Request, Response, NextFunction } from 'express';
import { rateLimitService } from '../config/database/redis/redis.service';
import ApiError from '../utils/apiError';
import { asyncHandler } from '../utils/asyncHandler';

export const rateLimiter = (limit: number = 100, windowName: string = 'global') => {
    return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const identifier = (req as any).user?.id || req.ip || req.headers['x-forwarded-for'] || 'unknown';

        const key = `${windowName}:${identifier}`;

        const { allowed, remaining } = await rateLimitService.check(key, limit);

        res.setHeader('X-RateLimit-Limit', limit);
        res.setHeader('X-RateLimit-Remaining', remaining);

        if (!allowed) {
            throw new ApiError(429, 'Too many requests, please try again later.');
        }

        next();
    });
};