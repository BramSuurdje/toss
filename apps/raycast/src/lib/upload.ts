import { readFile } from "fs/promises"

import type { CompletedPart } from "@transferflow/shared"
import {
  MULTIPART_PART_SIZE_BYTES,
  MULTIPART_UPLOAD_CONCURRENCY,
} from "@transferflow/shared"
import type { ShareCreateUpload } from "./api"

function toFetchBody(buffer: Buffer): Uint8Array {
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
}

function normalizeEtag(etag: string | null): string {
  if (!etag) {
    throw new Error(
      "Upload finished but ETag was missing. Check bucket CORS ExposeHeaders."
    )
  }
  return etag.replace(/^"|"$/g, "")
}

async function putPart(
  url: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  const response = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: toFetchBody(body),
  })

  if (!response.ok) {
    throw new Error(`Upload failed (${response.status})`)
  }

  return normalizeEtag(response.headers.get("ETag"))
}

async function runPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const batchCount = Math.ceil(items.length / concurrency)
  const batches = Array.from({ length: batchCount }, (_, batchIndex) => {
    const start = batchIndex * concurrency
    return items.slice(start, start + concurrency)
  })

  const batchResults = await Promise.all(
    batches.map((batch) => Promise.all(batch.map(worker)))
  )

  return batchResults.flat()
}

async function uploadMultipart(
  file: Buffer,
  upload: Extract<ShareCreateUpload, { mode: "multipart" }>,
  contentType: string
): Promise<CompletedPart[]> {
  const completed = await runPool(
    upload.parts,
    MULTIPART_UPLOAD_CONCURRENCY,
    async (part) => {
      const start = (part.partNumber - 1) * MULTIPART_PART_SIZE_BYTES
      const end = Math.min(start + MULTIPART_PART_SIZE_BYTES, file.length)
      const chunk = file.subarray(start, end)
      const etag = await putPart(part.url, chunk, contentType)
      return { partNumber: part.partNumber, etag }
    }
  )

  return completed.sort((a, b) => a.partNumber - b.partNumber)
}

export async function uploadFile(
  filePath: string,
  upload: ShareCreateUpload,
  contentType: string
): Promise<CompletedPart[] | undefined> {
  const file = await readFile(filePath)

  if (upload.mode === "single") {
    await putPart(upload.uploadUrl, file, contentType)
    return undefined
  }

  return uploadMultipart(file, upload, contentType)
}
