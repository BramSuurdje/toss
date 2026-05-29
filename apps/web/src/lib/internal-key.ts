import { INTERNAL_API_KEY_QUERY_PARAM } from "@transferflow/shared"

const STORAGE_KEY = "toss:internal-key"
const VERIFIED_KEY = "toss:internal-verified"

let keyCapturedThisLoad = false

export function captureInternalKeyFromUrl(): void {
  const params = new URLSearchParams(window.location.search)
  const key = params.get(INTERNAL_API_KEY_QUERY_PARAM)
  if (!key) {
    return
  }

  sessionStorage.setItem(STORAGE_KEY, key)
  sessionStorage.removeItem(VERIFIED_KEY)
  keyCapturedThisLoad = true

  params.delete(INTERNAL_API_KEY_QUERY_PARAM)
  const query = params.toString()
  const next =
    window.location.pathname + (query ? `?${query}` : "") + window.location.hash
  window.history.replaceState(null, "", next)
}

export function consumeKeyCapturedThisLoad(): boolean {
  const captured = keyCapturedThisLoad
  keyCapturedThisLoad = false
  return captured
}

export function getInternalKey(): string | null {
  return sessionStorage.getItem(STORAGE_KEY)
}

export function hasUnlimitedUpload(): boolean {
  return sessionStorage.getItem(VERIFIED_KEY) === "1"
}

export function markUnlimitedUploadVerified(): void {
  sessionStorage.setItem(VERIFIED_KEY, "1")
}

export function clearInternalKey(): void {
  sessionStorage.removeItem(STORAGE_KEY)
  sessionStorage.removeItem(VERIFIED_KEY)
}
