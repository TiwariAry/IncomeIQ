import { influxService } from "../../../src/config/database/influx/influx.service";
import { InfluxDB } from '@influxdata/influxdb-client';
import { DeleteAPI } from '@influxdata/influxdb-client-apis';

async function testInflux() {
    console.log('Starting InfluxDB Cloud Tests...\n');

    const testSymbol = "TEST_TICKER_" + Date.now();
    const org = process.env.INFLUXDB_ORG!;
    const bucket = process.env.INFLUXDB_BUCKET!;

    // Setup Delete API
    const influxDB = new InfluxDB({
        url: process.env.INFLUXDB_URL!,
        token: process.env.INFLUXDB_TOKEN!
    });
    const deleteApi = new DeleteAPI(influxDB);

    try {
        // 1. Write Data
        console.log(`Writing test point for ${testSymbol}...`);
        await influxService.recordStockPrice(testSymbol, 150.50, 1000);
        console.log('Write successful. Waiting 5s for consistency...');

        await new Promise(r => setTimeout(r, 5000));

        // 2. Read Data
        console.log('Reading back data...');
        const rows = await influxService.getHistoricalPrices(testSymbol, '-10m');

        if (rows.length > 0) {
            console.log(`Success. Retrieved ${rows.length} records.`);
            console.log(`Price: ${rows[0]['price']}, Symbol: ${rows[0]['symbol']}`);
        } else {
            console.error('Error: Data not found. Check policies or tokens.');
        }

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        // 3. Cleanup Data (Always runs)
        console.log(`\nCleaning up test data for ${testSymbol}...`);
        try {
            // Delete data from 24 hours ago until now
            const start = new Date();
            start.setHours(start.getHours() - 24);
            const stop = new Date();

            await deleteApi.postDelete({
                org,
                bucket,
                body: {
                    start: start.toISOString(),
                    stop: stop.toISOString(),
                    predicate: `symbol="${testSymbol}"`
                }
            });
            console.log('Cleanup successful. Database is clean.');
        } catch (cleanupError) {
            console.error('Cleanup Failed:', cleanupError);
        }
    }
}

testInflux();