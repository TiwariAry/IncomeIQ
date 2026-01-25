import { Request, Response } from 'express';
import { marketDataService } from './marketData.service';
import { asyncHandler } from '../../utils/asyncHandler';
import ApiResponse from "../../utils/apiResponse";

export const marketDataController = {
    getQuote: asyncHandler(async (req: Request, res: Response) => {
        const { symbol } = req.params;

        if (!symbol) {
            throw new Error('Stock symbol is required');
        }

        const data = await marketDataService.getQuote(symbol);

        res.status(200).json(
            new ApiResponse(200, data, 'Stock quote retrieved successfully')
        );
    }),

    getHistory: asyncHandler(async (req: Request, res: Response) => {
        const { symbol } = req.params;
        const { period } = req.query; // e.g. ?period=1mo

        const data = await marketDataService.getHistory(
            symbol,
            (period as '1d' | '1mo' | '1y') || '1mo'
        );

        res.status(200).json(
            new ApiResponse(200, data, 'Historical data retrieved successfully')
        );
    })
};