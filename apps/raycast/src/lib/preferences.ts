import { getPreferenceValues } from "@raycast/api"

import type { Retention } from "@transferflow/shared"

export interface Preferences {
  apiUrl: string
  webUrl: string
  retention: Retention
}

export function getPreferences(): Preferences {
  const values = getPreferenceValues<Preferences>()
  return {
    apiUrl: values.apiUrl.replace(/\/$/, ""),
    webUrl: values.webUrl.replace(/\/$/, ""),
    retention: values.retention,
  }
}

export function sharePageUrl(webUrl: string, id: string): string {
  return `${webUrl}/d/${id}`
}
