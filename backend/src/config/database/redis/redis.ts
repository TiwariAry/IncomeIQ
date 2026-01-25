import { Redis } from '@upstash/redis'
import { config } from 'dotenv'
config();

const url = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN

if (!url || !token) {
    throw new Error('REDIS CREDENTIALS MISSING: Check your .env file location.')
}

const redis = new Redis({
    url: url,
    token: token,
})

export default redis;