const STORAGE_KEY = "transferflow:upload-history"
const MAX_ENTRIES = 50

export const UPLOAD_HISTORY_CHANGED = "transferflow:upload-history-changed"

export type UploadHistoryEntry = {
  id: string
  filename: string
  expiresAt: number
  createdAt: number
}

function isUploadHistoryEntry(value: unknown): value is UploadHistoryEntry {
  if (typeof value !== "object" || value === null) return false
  const entry = value as UploadHistoryEntry
  return (
    typeof entry.id === "string" &&
    typeof entry.filename === "string" &&
    typeof entry.expiresAt === "number" &&
    typeof entry.createdAt === "number"
  )
}

function readRaw(): UploadHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isUploadHistoryEntry)
  } catch {
    return []
  }
}

function write(entries: UploadHistoryEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

function notifyChange(): void {
  window.dispatchEvent(new Event(UPLOAD_HISTORY_CHANGED))
}

export function pruneExpired(
  entries: UploadHistoryEntry[],
  now = Date.now()
): UploadHistoryEntry[] {
  return entries.filter((entry) => entry.expiresAt > now)
}

export function getUploadHistory(): UploadHistoryEntry[] {
  const raw = readRaw()
  const active = pruneExpired(raw)

  if (active.length !== raw.length) {
    write(active)
  }

  return active.sort((a, b) => b.createdAt - a.createdAt)
}

export function addUploadHistoryEntry(
  entry: Pick<UploadHistoryEntry, "id" | "filename" | "expiresAt">
): void {
  const next: UploadHistoryEntry = {
    ...entry,
    createdAt: Date.now(),
  }

  const active = getUploadHistory().filter((item) => item.id !== next.id)
  write([next, ...active].slice(0, MAX_ENTRIES))
  notifyChange()
}

export function sharePath(id: string): string {
  return `/d/${id}`
}
