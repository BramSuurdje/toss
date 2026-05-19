import {
  MULTIPART_PART_SIZE_BYTES,
  MULTIPART_UPLOAD_CONCURRENCY,
  type CompletedPart,
} from "@transferflow/shared"

import type { ShareCreateUpload } from "@/lib/api"

function uploadErrorMessage(xhr: XMLHttpRequest): string {
  if (xhr.status === 0) {
    return "Upload blocked (likely bucket CORS). Run: cd apps/api && bun run configure-cors"
  }

  if (xhr.status === 403) {
    return "Upload denied (403). Check bucket credentials and presigned URL settings."
  }

  if (xhr.status >= 400) {
    return `Upload failed (${xhr.status})`
  }

  return "Upload to storage failed"
}

function putBlob(
  url: string,
  blob: Blob,
  options?: {
    contentType?: string
    onPartProgress?: (loaded: number) => void
  }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("PUT", url)

    if (options?.contentType) {
      xhr.setRequestHeader("Content-Type", options.contentType)
    }

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        options?.onPartProgress?.(event.loaded)
      }
    })

    xhr.addEventListener("load", () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(uploadErrorMessage(xhr)))
        return
      }

      const etag = xhr.getResponseHeader("ETag")
      if (!etag) {
        reject(
          new Error(
            "Upload finished but ETag was not returned. Add ExposeHeaders: ETag to bucket CORS (bun run configure-cors in apps/api)."
          )
        )
        return
      }

      resolve(etag)
    })

    xhr.addEventListener("error", () => {
      reject(new Error(uploadErrorMessage(xhr)))
    })

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload cancelled"))
    })

    xhr.send(blob)
  })
}

export function uploadToPresignedUrl(
  uploadUrl: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<void> {
  return putBlob(uploadUrl, file, {
    contentType: file.type || "application/octet-stream",
    onPartProgress: (loaded) => {
      if (!onProgress) return
      onProgress(Math.round((loaded / file.size) * 100))
    },
  }).then(() => {
    onProgress?.(100)
  })
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

export async function uploadMultipart(
  file: File,
  upload: Extract<ShareCreateUpload, { mode: "multipart" }>,
  onProgress?: (percent: number) => void
): Promise<CompletedPart[]> {
  const partBytes = new Map<number, number>()

  const reportProgress = () => {
    if (!onProgress) return
    let loaded = 0
    for (const bytes of partBytes.values()) {
      loaded += bytes
    }
    onProgress(Math.min(100, Math.round((loaded / file.size) * 100)))
  }

  const completed = await runPool(
    upload.parts,
    MULTIPART_UPLOAD_CONCURRENCY,
    async (part) => {
      const start = (part.partNumber - 1) * MULTIPART_PART_SIZE_BYTES
      const end = Math.min(start + MULTIPART_PART_SIZE_BYTES, file.size)
      const blob = file.slice(start, end)

      const etag = await putBlob(part.url, blob, {
        onPartProgress: (loaded) => {
          partBytes.set(part.partNumber, loaded)
          reportProgress()
        },
      })

      partBytes.set(part.partNumber, blob.size)
      reportProgress()

      return { partNumber: part.partNumber, etag }
    }
  )

  onProgress?.(100)
  return completed.sort((a, b) => a.partNumber - b.partNumber)
}

export async function uploadShare(
  file: File,
  upload: ShareCreateUpload,
  onProgress?: (percent: number) => void
): Promise<CompletedPart[] | undefined> {
  if (upload.mode === "single") {
    await uploadToPresignedUrl(upload.uploadUrl, file, onProgress)
    return undefined
  }

  return uploadMultipart(file, upload, onProgress)
}
