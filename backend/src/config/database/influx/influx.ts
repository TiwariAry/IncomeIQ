import { InfluxDB } from '@influxdata/influxdb-client'
import dotenv from 'dotenv'
dotenv.config()

const url = process.env.INFLUXDB_URL as string
const token = process.env.INFLUXDB_TOKEN as string
const org = process.env.INFLUXDB_ORG as string
const bucket = process.env.INFLUXDB_BUCKET as string

const influxDB = new InfluxDB({ url, token })

export const influxWriteApi = influxDB.getWriteApi(org, bucket, 'ns')
export const influxQueryApi = influxDB.getQueryApi(org)

export default influxDB