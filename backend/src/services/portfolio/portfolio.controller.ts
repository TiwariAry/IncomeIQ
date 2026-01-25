import { Request, Response } from 'express';
import { portfolioService } from './portfolio.service';
import { asyncHandler } from '../../utils/asyncHandler';
import ApiResponse from "../../utils/apiResponse";

export const portfolioController = {
    create: asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const { name, initialCapital, description } = req.body;

        const portfolio = await portfolioService.createPortfolio(userId, name, initialCapital, description);

        res.status(201).json(
            new ApiResponse(201, portfolio, "Portfolio created")
        );
    }),

    getAll: asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const portfolios = await portfolioService.getUserPortfolios(userId);

        res.status(200).json(
            new ApiResponse(200, portfolios, "Portfolios retrieved")
        );
    }),

    buy: asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const { portfolioId } = req.params;
        // You can remove 'price' from here too, since we ignore it now
        const { ticker, quantity } = req.body;

        // ✅ FIXED: Only 4 arguments. 'userId' is now correctly placed.
        const result = await portfolioService.buyAsset(portfolioId, ticker, quantity, userId);

        res.status(200).json(
            new ApiResponse(200, result, "Buy order executed")
        );
    }),

    getDetails: asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const { portfolioId } = req.params;

        const summary = await portfolioService.getPortfolioSummary(portfolioId, userId);

        res.status(200).json(
            new ApiResponse(200, summary, "Portfolio details with live prices")
        );
    })
};