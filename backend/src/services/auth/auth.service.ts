import * as dotenv from 'dotenv'
dotenv.config()

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {sessionService} from "../../config/database/redis/redis.service";
import ApiError from "../../utils/apiError";

const prisma = new PrismaClient();

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_ACCESS_EXPIRE = process.env.JWT_ACCESS_EXPIRE;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE;

const generateTokens = (userId: string, role: string) => {
    if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
        throw new Error("JWT environment variables are not properly defined")
    }

    const accessToken = jwt.sign({ userId, role }, JWT_ACCESS_SECRET, { expiresIn: JWT_ACCESS_EXPIRE })
    const refreshToken = jwt.sign({ userId, role }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRE })

    return { accessToken, refreshToken }
};

export const authService = {
    register: async (email: string, password: string, firstName: string, lastName: string) => {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new ApiError(409, 'User with this email already exists');
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = await prisma.user.create({
            data: {
                email,
                passwordHash,
                firstName,
                lastName,
                role: 'USER',
            },
        });

        const { accessToken, refreshToken } = generateTokens(newUser.id, newUser.role);

        await sessionService.set(newUser.id, {
            refreshToken,
            lastLogin: new Date(),
        });

        return { user: newUser, accessToken, refreshToken };
    },

    login: async (email: string, password: string) => {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new ApiError(401, 'Invalid email or password');
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            throw new ApiError(401, 'Invalid email or password');
        }

        const { accessToken, refreshToken } = generateTokens(user.id, user.role);

        await sessionService.set(user.id, {
            refreshToken,
            lastLogin: new Date(),
        });

        return { user, accessToken, refreshToken };
    },

    logout: async (userId: string) => {
        await sessionService.delete(userId);
    }
};