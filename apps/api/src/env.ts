function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const env = {
  port: Number(process.env.PORT ?? 3001),
  webOrigin: required("WEB_ORIGIN"),
  redisUrl: required("REDIS_URL"),
  s3: {
    endpoint: required("S3_ENDPOINT"),
    region: process.env.S3_REGION ?? "auto",
    bucket: required("S3_BUCKET"),
    accessKeyId: required("S3_ACCESS_KEY_ID"),
    secretAccessKey: required("S3_SECRET_ACCESS_KEY"),
    /** Railway: false (virtual-hosted). MinIO local: true. */
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  },
  expirySweeperIntervalMs: Number(
    process.env.EXPIRY_SWEEPER_INTERVAL_MS ?? 60_000
  ),
  enableKeyspaceExpiry: process.env.ENABLE_KEYSPACE_EXPIRY !== "false",
}
