import {
  type CompletedPart,
  DOWNLOAD_URL_TTL_SECONDS,
  objectKeyForShare,
  PENDING_UPLOAD_TTL_SECONDS,
  retentionExpiresAt,
  shareRedisKey,
  shouldUseMultipartUpload,
  type ShareRecord,
  toPublicShare,
} from "@transferflow/shared"

import { EXPIRY_ZSET_KEY, redis } from "./redis"
import {
  abortMultipartUpload,
  completeMultipartUpload,
  createDownloadUrl,
  createMultipartPartUrls,
  createMultipartUpload,
  createUploadUrl,
  deleteObject,
  objectExists,
} from "./s3"

export type ShareCreateUpload =
  | { mode: "single"; uploadUrl: string }
  | {
      mode: "multipart"
      partSize: number
      parts: { partNumber: number; url: string }[]
    }

export async function getShareRecord(id: string): Promise<ShareRecord | null> {
  const raw = await redis.get(shareRedisKey(id))
  if (!raw) return null
  const record = JSON.parse(raw) as ShareRecord
  if (!record.uploadMode) {
    record.uploadMode = "single"
  }
  return record
}

export async function saveShareRecord(
  record: ShareRecord,
  ttlSeconds?: number
): Promise<void> {
  const key = shareRedisKey(record.id)
  const payload = JSON.stringify(record)

  if (ttlSeconds) {
    await redis.set(key, payload, "EX", ttlSeconds)
    return
  }

  const ttlMs = record.expiresAt - Date.now()
  if (ttlMs > 0) {
    await redis.set(key, payload, "PX", ttlMs)
  } else {
    await redis.set(key, payload)
  }
}

export async function indexExpiry(id: string, expiresAt: number): Promise<void> {
  await redis.zadd(EXPIRY_ZSET_KEY, expiresAt, id)
}

export async function removeExpiryIndex(id: string): Promise<void> {
  await redis.zrem(EXPIRY_ZSET_KEY, id)
}

export async function createPendingShare(
  record: Omit<
    ShareRecord,
    "status" | "objectKey" | "expiresAt" | "uploadMode" | "multipartUploadId"
  > & {
    retention: ShareRecord["retention"]
  }
): Promise<{ record: ShareRecord; upload: ShareCreateUpload }> {
  const objectKey = objectKeyForShare(record.id)
  const useMultipart = shouldUseMultipartUpload(record.size)

  const share: ShareRecord = {
    ...record,
    status: "pending",
    objectKey,
    expiresAt: Date.now() + PENDING_UPLOAD_TTL_SECONDS * 1000,
    uploadMode: useMultipart ? "multipart" : "single",
  }

  let upload: ShareCreateUpload

  if (useMultipart) {
    const uploadId = await createMultipartUpload(objectKey, share.contentType)
    share.multipartUploadId = uploadId

    const multipart = await createMultipartPartUrls(
      objectKey,
      uploadId,
      share.size
    )

    upload = {
      mode: "multipart",
      partSize: multipart.partSize,
      parts: multipart.parts,
    }
  } else {
    const uploadUrl = await createUploadUrl(
      objectKey,
      share.contentType,
      share.size
    )
    upload = { mode: "single", uploadUrl }
  }

  await saveShareRecord(share, PENDING_UPLOAD_TTL_SECONDS)

  return { record: share, upload }
}

export async function completeShare(
  id: string,
  parts?: CompletedPart[]
): Promise<
  ShareRecord | "missing" | "not_pending" | "object_missing" | "invalid_parts"
> {
  const existing = await getShareRecord(id)
  if (!existing) return "missing"
  if (existing.status !== "pending") return "not_pending"

  if (existing.uploadMode === "multipart") {
    if (!existing.multipartUploadId) return "missing"
    if (!parts?.length) return "invalid_parts"

    try {
      await completeMultipartUpload(
        existing.objectKey,
        existing.multipartUploadId,
        parts
      )
    } catch {
      return "object_missing"
    }
  } else {
    const exists = await objectExists(existing.objectKey)
    if (!exists) return "object_missing"
  }

  const expiresAt = retentionExpiresAt(existing.retention)
  const ready: ShareRecord = {
    ...existing,
    status: "ready",
    expiresAt,
    multipartUploadId: undefined,
  }

  await saveShareRecord(ready)
  await indexExpiry(id, expiresAt)

  return ready
}

export async function getReadySharePublic(id: string) {
  const record = await getShareRecord(id)
  if (!record || record.status !== "ready") return null
  if (record.expiresAt <= Date.now()) return null
  return toPublicShare(record)
}

export async function createShareDownloadUrl(id: string) {
  const record = await getShareRecord(id)
  if (!record || record.status !== "ready") return null
  if (record.expiresAt <= Date.now()) return null

  const url = await createDownloadUrl(
    record.objectKey,
    record.filename,
    record.contentType
  )

  return { url, expiresIn: DOWNLOAD_URL_TTL_SECONDS }
}

export async function purgeShare(id: string, record?: ShareRecord | null) {
  const share = record ?? (await getShareRecord(id))
  const objectKey = share?.objectKey ?? objectKeyForShare(id)

  if (share?.multipartUploadId) {
    await abortMultipartUpload(objectKey, share.multipartUploadId)
  }

  try {
    await deleteObject(objectKey)
  } catch (error) {
    console.error(`Failed to delete object for share ${id}`, error)
  }

  await redis.del(shareRedisKey(id))
  await removeExpiryIndex(id)
}
