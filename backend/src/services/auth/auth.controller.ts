import { Request, Response } from 'express';
import { authService } from './auth.service';
import {asyncHandler} from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";

export const authController = {
    register: asyncHandler(async (req: Request, res: Response) => {
        const { email, password, firstName, lastName } = req.body;

        const { user, accessToken, refreshToken } = await authService.register(
            email,
            password,
            firstName,
            lastName
        );

        const { passwordHash, ...userWithoutPassword } = user;

        res.status(201).json(
            new ApiResponse(201, { user: userWithoutPassword, accessToken, refreshToken }, 'User registered successfully')
        );
    }),

    login: asyncHandler(async (req: Request, res: Response) => {
        const { email, password } = req.body;

        const { user, accessToken, refreshToken } = await authService.login(email, password);

        const { passwordHash, ...userWithoutPassword } = user;

        res.status(200).json(
            new ApiResponse(200, { user: userWithoutPassword, accessToken, refreshToken }, 'Login successful')
        );
    }),

    logout: asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user?.id;

        if (userId) {
            await authService.logout(userId);
        }

        res.status(200).json(
            new ApiResponse(200, {}, 'Logged out successfully')
        );
    })
};