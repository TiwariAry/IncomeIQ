import { Request, Response } from 'express';
import { analysisService } from './analysis.service';
import { asyncHandler } from '../../utils/asyncHandler';
import ApiResponse from "../../utils/apiResponse";

export const analysisController = {
    run: asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const { portfolioId } = req.params;

        const report = await analysisService.runSimulation(portfolioId, userId);

        res.status(200).json(
            new ApiResponse(200, report, "Analysis generated successfully")
        );
    }),

    getHistory: asyncHandler(async (req: Request, res: Response) => {
        const { portfolioId } = req.params;
        const history = await analysisService.getAnalysisHistory(portfolioId);

        res.status(200).json(
            new ApiResponse(200, history, "Analysis history retrieved")
        );
    }),

    compare: asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const { id1, id2 } = req.body; // Pass two IDs in body
        const result = await analysisService.compareStrategies(id1, id2, userId);
        res.status(200).json(new ApiResponse(200, result, "Comparison complete"));
    }),

    stressTest: asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const { portfolioId } = req.params;
        const result = await analysisService.runStressTest(portfolioId, userId);
        res.status(200).json(new ApiResponse(200, result, "Stress test complete"));
    })
};