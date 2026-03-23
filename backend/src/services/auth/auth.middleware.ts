import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { asyncHandler } from "../../utils/asyncHandler";
import ApiError from "../../utils/apiError";
import { sessionService } from '../../config/database/redis/redis.service';
import prismaClient from '../../config/database/postgresql/postgresql';

export const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as any;

            const sessionActive = await sessionService.get(decoded.userId);

            if (!sessionActive) {
                throw new ApiError(401, 'Session expired or logged out.');
            }

            const user = await prismaClient.user.findUnique({
                where: { id: decoded.userId },
                select: { id: true, email: true, role: true }
            });

            if (!user) {
                throw new ApiError(401, 'User no longer exists');
            }

            (req as any).user = user;
            next();
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(401, 'Not authorized, token failed');
        }
    }

    if (!token) {
        throw new ApiError(401, 'Not authorized, no token');
    }
});