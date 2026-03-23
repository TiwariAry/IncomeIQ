import express, { Application } from 'express'
import cors from 'cors'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'

import {connectDB} from "./config/database/mongodb/mongodb";

import authRoutes from "./services/auth/auth.routes";
import marketDataRoutes from "./services/marketData/marketData.routes";
import portfolioRoutes from "./services/portfolio/portfolio.routes";
import analysisRoutes from './services/analysis/analysis.routes';

const app: Application = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(morgan('dev'))

app.use(express.json())
app.use(cookieParser())

// Routes
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/market', marketDataRoutes)
app.use('/api/v1/portfolio', portfolioRoutes)
app.use('/api/v1/analysis', analysisRoutes)

app.get('/', (req, res) => {
    res.status(200).json({
        status: true,
        package: {
            message: "Hello"
        }
    })
})

const start = async () => {
    try {
        await connectDB()
        app.listen(PORT, () => {
            console.log("Listening on port: " + PORT)
            console.log("http://localhost:" + PORT)
        })
    }
    catch (error) {
        console.error(error)
        process.exit(1)
    }
}

start()

export default app