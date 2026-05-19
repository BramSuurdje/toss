import type {
  CompletedPart,
  Retention,
  SharePublic,
} from "@workspace/shared"

import { putBlobWithProgress, uploadMultipartFile } from "./upload"

const API_BASE = import.meta.env.VITE_API_URL ?? ""

type ApiError = {
  error: string
}

async function parseJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T | ApiError
  if (!response.ok) {
    const message =
      typeof data === "object" && data && "error" in data
        ? String((data as ApiError).error)
        : response.statusText
    throw new Error(message)
  }
  return data as T
}

type CreateShareSimpleResponse = {
  id: string
  uploadMode: "simple"
  uploadUrl: string
}

type CreateShareMultipartResponse = {
  id: string
  uploadMode: "multipart"
  partSize: number
  parts: { partNumber: number; uploadUrl: string }[]
}

type CreateShareResponse =
  | CreateShareSimpleResponse
  | CreateShareMultipartResponse

export async function createShare(input: {
  filename: string
  contentType: string
  size: number
  retention: Retention
}): Promise<CreateShareResponse> {
  const response = await fetch(`${API_BASE}/shares`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  return parseJson(response)
}

export async function uploadShareFile(
  created: CreateShareResponse,
  file: File,
  onProgress?: (percent: number) => void
): Promise<CompletedPart[] | undefined> {
  if (created.uploadMode === "simple") {
    await putBlobWithProgress(
      created.uploadUrl,
      file,
      file.type || "application/octet-stream",
      (loaded, total) => {
        onProgress?.(Math.round((loaded / total) * 100))
      }
    )
    return undefined
  }

  return uploadMultipartFile(
    file,
    created.parts,
    created.partSize,
    onProgress
  )
}

export async function completeShare(
  id: string,
  parts?: CompletedPart[]
): Promise<{ share: SharePublic }> {
  const response = await fetch(`${API_BASE}/shares/${id}/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parts ? { parts } : {}),
  })
  return parseJson(response)
}

export async function getShare(id: string): Promise<SharePublic> {
  const response = await fetch(`${API_BASE}/shares/${id}`)
  const data = await parseJson<{ share: SharePublic }>(response)
  return data.share
}

export async function getDownloadUrl(
  id: string
): Promise<{ url: string; expiresIn: number }> {
  const response = await fetch(`${API_BASE}/shares/${id}/download`, {
    method: "POST",
  })
  return parseJson(response)
}

export function sharePageUrl(id: string): string {
  return `${window.location.origin}/d/${id}`
}
