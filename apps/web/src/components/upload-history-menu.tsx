import { Button } from "@transferflow/ui/components/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@transferflow/ui/components/empty"
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger
} from "@transferflow/ui/components/popover"
import { ScrollArea } from "@transferflow/ui/components/scroll-area"
import { History } from "lucide-react"
import * as React from "react"
import { useNavigate } from "react-router-dom"

import {
  getUploadHistory,
  sharePath,
  UPLOAD_HISTORY_CHANGED,
  type UploadHistoryEntry,
} from "@/lib/upload-history"

function formatTimeRemaining(expiresAt: number): string {
  const ms = expiresAt - Date.now()
  if (ms <= 0) return "Expired"

  const hours = Math.floor(ms / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days}d left`
  }

  if (hours > 0) {
    return `${hours}h left`
  }

  const minutes = Math.max(1, Math.floor(ms / (1000 * 60)))
  return `${minutes}m left`
}

function HistoryItem({
  entry,
  onSelect,
}: {
  entry: UploadHistoryEntry
  onSelect: (id: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(entry.id)}
      className="flex w-full min-w-0 flex-col gap-0.5 rounded-xl px-3 py-2 text-left transition-colors hover:bg-muted"
    >
      <span className="truncate font-medium">{entry.filename}</span>
      <span className="text-xs text-muted-foreground">
        {formatTimeRemaining(entry.expiresAt)}
      </span>
    </button>
  )
}

export function UploadHistoryMenu() {
  const navigate = useNavigate()
  const [open, setOpen] = React.useState(false)
  const [entries, setEntries] = React.useState<UploadHistoryEntry[]>(() =>
    getUploadHistory()
  )

  const refresh = React.useCallback(() => {
    setEntries(getUploadHistory())
  }, [])

  React.useEffect(() => {
    window.addEventListener(UPLOAD_HISTORY_CHANGED, refresh)
    return () => window.removeEventListener(UPLOAD_HISTORY_CHANGED, refresh)
  }, [refresh])

  const onOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen)
      if (nextOpen) refresh()
    },
    [refresh]
  )

  const onSelect = (id: string) => {
    setOpen(false)
    navigate(sharePath(id))
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            type="button"
            aria-label="Upload history"
          >
            <History />
          </Button>
        }
      />
      <PopoverContent align="end" className="w-80 gap-3 p-3">
      <div className="mb-2">
          <PopoverTitle className="text-base">Recent uploads</PopoverTitle>
        </div>

        {entries.length === 0 ? (
          <Empty className="py-8">
            <EmptyHeader>
              <EmptyTitle className="text-sm">No uploads yet</EmptyTitle>
              <EmptyDescription>
                Files you share from this device will show up here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ScrollArea className="max-h-64">
            <ul className="flex flex-col gap-0.5">
              {entries.map((entry) => (
                <li key={entry.id}>
                  <HistoryItem entry={entry} onSelect={onSelect} />
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  )
}
