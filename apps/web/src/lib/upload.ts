import {
  MULTIPART_PART_SIZE_BYTES,
  MULTIPART_UPLOAD_CONCURRENCY,
  type CompletedPart,
} from "@workspace/shared"

export function putBlobWithProgress(
  uploadUrl: string,
  blob: Blob,
  contentType: string,
  onPartProgress?: (loaded: number, total: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("PUT", uploadUrl)
    xhr.setRequestHeader("Content-Type", contentType)

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) return
      onPartProgress?.(event.loaded, event.total)
    })

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const etag = xhr.getResponseHeader("ETag")
        if (!etag) {
          reject(new Error("Upload succeeded but ETag was missing"))
          return
        }
        resolve(etag)
        return
      }
      reject(new Error("Upload to storage failed"))
    })

    xhr.addEventListener("error", () => {
      reject(new Error("Upload to storage failed"))
    })

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload cancelled"))
    })

    xhr.send(blob)
  })
}

export async function uploadMultipartFile(
  file: File,
  parts: { partNumber: number; uploadUrl: string }[],
  partSize: number,
  onProgress?: (percent: number) => void
): Promise<CompletedPart[]> {
  const contentType = file.type || "application/octet-stream"
  const partLoaded = new Array<number>(parts.length).fill(0)
  const completed: CompletedPart[] = []

  const reportProgress = () => {
    const loaded = partLoaded.reduce((sum, value) => sum + value, 0)
    const percent = Math.min(100, Math.round((loaded / file.size) * 100))
    onProgress?.(percent)
  }

  let nextIndex = 0

  const worker = async () => {
    while (true) {
      const index = nextIndex
      nextIndex += 1
      if (index >= parts.length) return

      const { partNumber, uploadUrl } = parts[index]!
      const start = (partNumber - 1) * partSize
      const end = Math.min(start + partSize, file.size)
      const blob = file.slice(start, end)

      const etag = await putBlobWithProgress(
        uploadUrl,
        blob,
        contentType,
        (loaded, total) => {
          partLoaded[index] = loaded
          reportProgress()
        }
      )

      partLoaded[index] = blob.size
      reportProgress()
      completed.push({ partNumber, etag })
    }
  }

  const poolSize = Math.min(MULTIPART_UPLOAD_CONCURRENCY, parts.length)
  await Promise.all(Array.from({ length: poolSize }, () => worker()))

  onProgress?.(100)
  return completed.sort((a, b) => a.partNumber - b.partNumber)
}

export { MULTIPART_PART_SIZE_BYTES }
