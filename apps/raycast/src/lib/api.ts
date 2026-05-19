import type { CompletedPart, Retention } from "@transferflow/shared"

type ApiError = {
  error: string
}

export type ShareCreateUpload =
  | { mode: "single"; uploadUrl: string }
  | {
      mode: "multipart"
      partSize: number
      parts: { partNumber: number; url: string }[]
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

export function createApiClient(apiUrl: string) {
  const base = apiUrl.replace(/\/$/, "")

  return {
    async createShare(input: {
      filename: string
      contentType: string
      size: number
      retention: Retention
    }): Promise<{ id: string; upload: ShareCreateUpload }> {
      const response = await fetch(`${base}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      return parseJson(response)
    },

    async completeShare(
      id: string,
      parts?: CompletedPart[]
    ): Promise<{ share: { id: string; filename: string } }> {
      const response = await fetch(`${base}/shares/${id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parts?.length ? { parts } : {}),
      })
      return parseJson(response)
    },
  }
}
