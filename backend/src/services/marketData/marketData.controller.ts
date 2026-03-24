import { Request, Response } from 'express';
import { marketDataService } from './marketData.service';
import { asyncHandler } from '../../utils/asyncHandler';
import ApiResponse from "../../utils/apiResponse";

export const marketDataController = {
    getQuote: asyncHandler(async (req: Request, res: Response) => {
        const symbol = req.params.symbol as string;
        if (!symbol) throw new Error('Stock symbol is required');
        const data = await marketDataService.getQuote(symbol);
        res.status(200).json(new ApiResponse(200, data, 'Stock quote retrieved successfully'));
    }),

    getHistory: asyncHandler(async (req: Request, res: Response) => {
        const symbol = req.params.symbol as string;
        const period = (req.query.period as string || '1mo') as '1d' | '1mo' | '1y';
        const data = await marketDataService.getHistory(symbol, period);
        res.status(200).json(new ApiResponse(200, data, 'Historical data retrieved successfully'));
    })
};