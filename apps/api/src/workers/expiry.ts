import { shareRedisKey } from "@workspace/shared"

import { env } from "../env"
import { EXPIRY_ZSET_KEY, redis } from "../lib/redis"
import { getShareRecord, purgeShare } from "../lib/shares"

async function handleExpiredShareKey(key: string): Promise<void> {
  const id = key.replace(/^share:/, "")
  if (!id) return

  const record = await getShareRecord(id)
  await purgeShare(id, record)
}

export function startKeyspaceExpiryListener(): void {
  if (!env.enableKeyspaceExpiry) return

  const subscriber = redis.duplicate()

  subscriber.on("error", (error) => {
    console.error("Redis keyspace subscriber error", error)
  })

  void (async () => {
    await subscriber.connect()
    await subscriber.psubscribe("__keyevent@*__:expired")

    subscriber.on("pmessage", (_pattern, channel, message) => {
      if (!channel.endsWith(":expired")) return
      if (!message.startsWith("share:")) return
      void handleExpiredShareKey(message)
    })
  })()
}

export function startExpirySweeper(): void {
  const tick = async () => {
    const now = Date.now()
    const expiredIds = await redis.zrangebyscore(EXPIRY_ZSET_KEY, 0, now)

    for (const id of expiredIds) {
      const record = await getShareRecord(id)
      if (record && record.expiresAt > now && record.status === "ready") {
        await redis.zrem(EXPIRY_ZSET_KEY, id)
        continue
      }

      await purgeShare(id, record)
    }
  }

  void tick()
  setInterval(() => {
    void tick()
  }, env.expirySweeperIntervalMs)
}
