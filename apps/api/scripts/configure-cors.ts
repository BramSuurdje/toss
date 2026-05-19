/**
 * One-time bucket CORS setup for browser presigned PUT / multipart uploads.
 *
 * Usage (from apps/api, with .env filled in):
 *   bun run scripts/configure-cors.ts
 *
 * Optional extra origins:
 *   bun run scripts/configure-cors.ts https://myapp.com http://localhost:5173
 */
import { PutBucketCorsCommand, S3Client } from "@aws-sdk/client-s3"

import { env } from "../src/env"

const extraOrigins = process.argv.slice(2)
const origins = [
  env.webOrigin,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  ...extraOrigins,
].filter((value, index, array) => array.indexOf(value) === index)

const client = new S3Client({
  region: env.s3.region,
  endpoint: env.s3.endpoint,
  credentials: {
    accessKeyId: env.s3.accessKeyId,
    secretAccessKey: env.s3.secretAccessKey,
  },
  forcePathStyle: env.s3.forcePathStyle,
})

await client.send(
  new PutBucketCorsCommand({
    Bucket: env.s3.bucket,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedHeaders: ["*"],
          AllowedMethods: ["GET", "PUT", "POST", "HEAD"],
          AllowedOrigins: origins,
          ExposeHeaders: ["ETag"],
          MaxAgeSeconds: 3600,
        },
      ],
    },
  })
)

console.log("Bucket CORS configured for origins:")
for (const origin of origins) {
  console.log(`  - ${origin}`)
}
