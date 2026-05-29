import {
  INTERNAL_API_KEY_HEADER,
  type CompletedPart,
  type Retention,
} from "@transferflow/shared"

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

function requestHeaders(internalApiKey?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (internalApiKey) {
    headers[INTERNAL_API_KEY_HEADER] = internalApiKey
  }
  return headers
}

export function createApiClient(apiUrl: string, internalApiKey?: string) {
  const base = apiUrl.replace(/\/$/, "")
  const headers = () => requestHeaders(internalApiKey)

  return {
    async createShare(input: {
      filename: string
      contentType: string
      size: number
      retention: Retention
    }): Promise<{ id: string; upload: ShareCreateUpload }> {
      const response = await fetch(`${base}/shares`, {
        method: "POST",
        headers: headers(),
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
        headers: headers(),
        body: JSON.stringify(parts?.length ? { parts } : {}),
      })
      return parseJson(response)
    },
  }
}
