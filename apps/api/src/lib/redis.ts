import Redis from "ioredis"

import { env } from "../env"

export const redis = new Redis(env.redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
})

export const EXPIRY_ZSET_KEY = "shares:expiry"

export async function connectRedis(): Promise<void> {
  await redis.connect()

  if (env.enableKeyspaceExpiry) {
    try {
      await redis.config("SET", "notify-keyspace-events", "Ex")
    } catch {
      console.warn(
        "Could not enable Redis keyspace notifications; relying on expiry sweeper"
      )
    }
  }
}
