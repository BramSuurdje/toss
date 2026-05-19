export const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024

export const RETENTION_OPTIONS = ["24h", "7d"] as const
export type Retention = (typeof RETENTION_OPTIONS)[number]

export const RETENTION_SECONDS: Record<Retention, number> = {
  "24h": 24 * 60 * 60,
  "7d": 7 * 24 * 60 * 60,
}

export const PENDING_UPLOAD_TTL_SECONDS = 60 * 60
export const DOWNLOAD_URL_TTL_SECONDS = 5 * 60

/** Use multipart upload at or above this size (single PUT below). */
export const MULTIPART_THRESHOLD_BYTES = 32 * 1024 * 1024

/** S3 minimum part size is 5 MB; 8 MB is a good default. */
export const MULTIPART_PART_SIZE_BYTES = 8 * 1024 * 1024

export const MULTIPART_UPLOAD_CONCURRENCY = 4

export type ShareStatus = "pending" | "ready"

export type UploadMode = "simple" | "multipart"

export type CompletedPart = {
  partNumber: number
  etag: string
}

export type ShareRecord = {
  id: string
  status: ShareStatus
  filename: string
  contentType: string
  size: number
  objectKey: string
  retention: Retention
  createdAt: number
  expiresAt: number
  uploadMode: UploadMode
  multipartUploadId?: string
}

export function shouldUseMultipartUpload(size: number): boolean {
  return size >= MULTIPART_THRESHOLD_BYTES
}

export function multipartPartCount(size: number): number {
  return Math.ceil(size / MULTIPART_PART_SIZE_BYTES)
}

export type SharePublic = {
  id: string
  filename: string
  contentType: string
  size: number
  retention: Retention
  createdAt: number
  expiresAt: number
}

const BLOCKED_EXTENSIONS = new Set([
  "exe",
  "msi",
  "dmg",
  "pkg",
  "app",
  "bat",
  "cmd",
  "com",
  "scr",
  "ps1",
  "sh",
  "bash",
  "apk",
  "jar",
  "deb",
  "rpm",
  "run",
  "bin",
  "dll",
  "sys",
  "vbs",
  "js",
  "mjs",
  "cjs",
  "wsf",
  "hta",
  "inf",
  "reg",
])

const BLOCKED_CONTENT_TYPE_PREFIXES = [
  "application/x-msdownload",
  "application/x-msdos-program",
  "application/x-executable",
  "application/x-sh",
  "application/x-bat",
  "application/vnd.microsoft.portable-executable",
  "application/java-archive",
]

export function objectKeyForShare(id: string): string {
  return `shares/${id}`
}

export function shareRedisKey(id: string): string {
  return `share:${id}`
}

export function retentionExpiresAt(retention: Retention, fromMs = Date.now()): number {
  return fromMs + RETENTION_SECONDS[retention] * 1000
}

export function isBlockedFile(filename: string, contentType: string): boolean {
  const extension = filename.split(".").pop()?.toLowerCase() ?? ""
  if (BLOCKED_EXTENSIONS.has(extension)) {
    return true
  }

  const normalizedType = contentType.split(";")[0]?.trim().toLowerCase() ?? ""
  return BLOCKED_CONTENT_TYPE_PREFIXES.some(
    (prefix) =>
      normalizedType === prefix || normalizedType.startsWith(`${prefix}/`)
  )
}

export function toPublicShare(record: ShareRecord): SharePublic {
  return {
    id: record.id,
    filename: record.filename,
    contentType: record.contentType,
    size: record.size,
    retention: record.retention,
    createdAt: record.createdAt,
    expiresAt: record.expiresAt,
  }
}
