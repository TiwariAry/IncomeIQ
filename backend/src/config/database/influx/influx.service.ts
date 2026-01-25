import { Point } from '@influxdata/influxdb-client'
import {influxQueryApi, influxWriteApi} from "./influx.js";

// Define a clean interface for what the rest of the app expects
export interface StockData {
    symbol: string;
    price: number;
    volume: number;
    time: Date;
}

export const influxService = {
    recordStockPrice: async (symbol: string, price: number, volume: number) => {
        const point = new Point('stock_price')
            .tag('symbol', symbol)
            .floatField('price', price)
            .intField('volume', volume)

        influxWriteApi.writePoint(point)
        await influxWriteApi.flush()
    },

    getHistoricalPrices: async (symbol: string, timeRange: string = '-24h'): Promise<StockData[]> => {
        // We use "pivot" to turn _field rows into actual columns (price, volume)
        const fluxQuery = `
            from(bucket: "${process.env.INFLUXDB_BUCKET}")
                |> range(start: ${timeRange})
                |> filter(fn: (r) => r["_measurement"] == "stock_price")
                |> filter(fn: (r) => r["symbol"] == "${symbol}")
                |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value") 
        `

        const rawRows = await influxQueryApi.collectRows(fluxQuery)

        // Map the raw Influx row to our clean interface
        return rawRows.map((row: any) => ({
            symbol: row.symbol,
            price: row.price,   // Now this will exist because of pivot()
            volume: row.volume, // This too
            time: new Date(row._time)
        }));
    }
}