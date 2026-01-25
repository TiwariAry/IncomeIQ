import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalysis extends Document {
    portfolioId: string;
    userId: string;
    simulationType: string;
    status: string;
    results: {
        projectedValue: number;
        riskScore: number;
        sharpeRatio: number;
        metrics?: {
            volatility: number;
            beta: number;
            maxDrawdown: number;
        };
        confidenceIntervals: {
            p10: number;
            p50: number;
            p90: number;
        };
        simulatedPaths?: number[][];
    };
    aiInsights: string[];
    createdAt: Date;
}

const AnalysisSchema: Schema = new Schema<IAnalysis>({
    portfolioId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    simulationType: { type: String, default: 'MONTE_CARLO' },
    status: { type: String, default: 'COMPLETED' },

    results: {
        projectedValue: Number,
        riskScore: Number,
        sharpeRatio: Number,
        metrics: {
            volatility: Number,
            beta: Number,
            maxDrawdown: Number,
        },
        confidenceIntervals: {
            p10: Number,
            p50: Number,
            p90: Number,
        },
        simulatedPaths: [[Number]],
    },

    aiInsights: [String],
    createdAt: { type: Date, default: Date.now, expires: '30d' },
});

const Analysis = mongoose.model<IAnalysis>('Analysis', AnalysisSchema)

export default Analysis