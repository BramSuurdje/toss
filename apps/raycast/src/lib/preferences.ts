import { getPreferenceValues } from "@raycast/api"

import type { Retention } from "@transferflow/shared"

interface PreferenceValues {
  webUrl: string
  retention: Retention
}

export interface Preferences {
  apiUrl: string
  webUrl: string
  retention: Retention
}

export function apiUrlForWebOrigin(webUrl: string): string {
  const origin = webUrl.replace(/\/$/, "")

  try {
    const { hostname } = new URL(origin)
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:3001"
    }
  } catch {
    // Invalid URL; fall through to /api suffix.
  }

  return `${origin}/api`
}

export function getPreferences(): Preferences {
  const values = getPreferenceValues<PreferenceValues>()
  const webUrl = values.webUrl.replace(/\/$/, "")

  return {
    webUrl,
    apiUrl: apiUrlForWebOrigin(webUrl),
    retention: values.retention,
  }
}

export function sharePageUrl(webUrl: string, id: string): string {
  return `${webUrl}/d/${id}`
}
