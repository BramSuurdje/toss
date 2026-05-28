import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

import { MULTIPART_PART_SIZE_BYTES, getMultipartPartCount } from "@transferflow/shared"

import { env } from "../env"

const s3Credentials = {
  accessKeyId: env.s3.accessKeyId,
  secretAccessKey: env.s3.secretAccessKey,
}

const s3ClientConfig = {
  region: env.s3.region,
  credentials: s3Credentials,
  forcePathStyle: env.s3.forcePathStyle,
}

export const s3 = new S3Client({
  ...s3ClientConfig,
  endpoint: env.s3.endpoint,
})

const s3Presign = new S3Client({
  ...s3ClientConfig,
  endpoint: env.s3.publicEndpoint,
})

const PRESIGN_EXPIRES_SECONDS = 3600

export async function createUploadUrl(
  objectKey: string,
  contentType: string,
  size: number
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: env.s3.bucket,
    Key: objectKey,
    ContentType: contentType,
    ContentLength: size,
  })

  return getSignedUrl(s3Presign, command, { expiresIn: PRESIGN_EXPIRES_SECONDS })
}

export async function createMultipartUpload(
  objectKey: string,
  contentType: string
): Promise<string> {
  const response = await s3.send(
    new CreateMultipartUploadCommand({
      Bucket: env.s3.bucket,
      Key: objectKey,
      ContentType: contentType,
    })
  )

  if (!response.UploadId) {
    throw new Error("Failed to start multipart upload")
  }

  return response.UploadId
}

export async function createMultipartPartUrls(
  objectKey: string,
  uploadId: string,
  size: number
): Promise<{ partSize: number; parts: { partNumber: number; url: string }[] }> {
  const partCount = getMultipartPartCount(size)
  const parts: { partNumber: number; url: string }[] = []

  for (let partNumber = 1; partNumber <= partCount; partNumber++) {
    const command = new UploadPartCommand({
      Bucket: env.s3.bucket,
      Key: objectKey,
      UploadId: uploadId,
      PartNumber: partNumber,
    })

    const url = await getSignedUrl(s3Presign, command, {
      expiresIn: PRESIGN_EXPIRES_SECONDS,
    })

    parts.push({ partNumber, url })
  }

  return { partSize: MULTIPART_PART_SIZE_BYTES, parts }
}

export async function completeMultipartUpload(
  objectKey: string,
  uploadId: string,
  parts: { partNumber: number; etag: string }[]
): Promise<void> {
  await s3.send(
    new CompleteMultipartUploadCommand({
      Bucket: env.s3.bucket,
      Key: objectKey,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts
          .map((part) => ({
            PartNumber: part.partNumber,
            ETag: part.etag,
          }))
          .sort((a, b) => a.PartNumber - b.PartNumber),
      },
    })
  )
}

export async function abortMultipartUpload(
  objectKey: string,
  uploadId: string
): Promise<void> {
  try {
    await s3.send(
      new AbortMultipartUploadCommand({
        Bucket: env.s3.bucket,
        Key: objectKey,
        UploadId: uploadId,
      })
    )
  } catch {
    // Upload may already be completed or aborted.
  }
}

function contentDispositionAttachment(filename: string): string {
  const ascii = filename
    .replace(/[^\x20-\x7E]/g, "_")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
  const utf8 = encodeURIComponent(filename)
  return `attachment; filename="${ascii}"; filename*=UTF-8''${utf8}`
}

export async function createDownloadUrl(
  objectKey: string,
  filename: string,
  contentType: string
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: env.s3.bucket,
    Key: objectKey,
    ResponseContentDisposition: contentDispositionAttachment(filename),
    ResponseContentType: contentType,
  })

  return getSignedUrl(s3Presign, command, { expiresIn: 300 })
}

export async function objectExists(objectKey: string): Promise<boolean> {
  try {
    await s3.send(
      new HeadObjectCommand({
        Bucket: env.s3.bucket,
        Key: objectKey,
      })
    )
    return true
  } catch {
    return false
  }
}

export async function deleteObject(objectKey: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: env.s3.bucket,
      Key: objectKey,
    })
  )
}
