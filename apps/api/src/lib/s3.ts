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

import { MULTIPART_PART_SIZE_BYTES, multipartPartCount } from "@workspace/shared"

import { env } from "../env"

export const s3 = new S3Client({
  region: env.s3.region,
  endpoint: env.s3.endpoint,
  credentials: {
    accessKeyId: env.s3.accessKeyId,
    secretAccessKey: env.s3.secretAccessKey,
  },
  forcePathStyle: env.s3.forcePathStyle,
})

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

  return getSignedUrl(s3, command, { expiresIn: 3600 })
}

export async function startMultipartUpload(
  objectKey: string,
  contentType: string
): Promise<string> {
  const result = await s3.send(
    new CreateMultipartUploadCommand({
      Bucket: env.s3.bucket,
      Key: objectKey,
      ContentType: contentType,
    })
  )

  if (!result.UploadId) {
    throw new Error("Failed to start multipart upload")
  }

  return result.UploadId
}

export async function createPartUploadUrl(
  objectKey: string,
  uploadId: string,
  partNumber: number
): Promise<string> {
  const command = new UploadPartCommand({
    Bucket: env.s3.bucket,
    Key: objectKey,
    UploadId: uploadId,
    PartNumber: partNumber,
  })

  return getSignedUrl(s3, command, { expiresIn: 3600 })
}

export async function createAllPartUploadUrls(
  objectKey: string,
  uploadId: string,
  fileSize: number
): Promise<{ partNumber: number; uploadUrl: string }[]> {
  const count = multipartPartCount(fileSize)
  const parts: { partNumber: number; uploadUrl: string }[] = []

  for (let partNumber = 1; partNumber <= count; partNumber++) {
    const uploadUrl = await createPartUploadUrl(objectKey, uploadId, partNumber)
    parts.push({ partNumber, uploadUrl })
  }

  return parts
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
          .slice()
          .sort((a, b) => a.partNumber - b.partNumber)
          .map((part) => ({
            PartNumber: part.partNumber,
            ETag: part.etag,
          })),
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

export async function createDownloadUrl(
  objectKey: string,
  filename: string,
  contentType: string
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: env.s3.bucket,
    Key: objectKey,
    ResponseContentDisposition: `attachment; filename="${encodeURIComponent(filename)}"`,
    ResponseContentType: contentType,
  })

  return getSignedUrl(s3, command, { expiresIn: 300 })
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

export { MULTIPART_PART_SIZE_BYTES }
