import type { SharePublic } from "@workspace/shared"
import { Copy, Download } from "lucide-react"
import * as React from "react"
import { useParams } from "react-router-dom"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Spinner } from "@workspace/ui/components/spinner"

import { NewUploadLink } from "@/components/new-upload-link"
import { getDownloadUrl, getShare, sharePageUrl } from "@/lib/api"

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / 1024 ** i).toFixed(i ? 1 : 0)} ${sizes[i]}`
}

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

export function DownloadPage() {
  const { id } = useParams<{ id: string }>()
  const [share, setShare] = React.useState<SharePublic | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [notFound, setNotFound] = React.useState(false)
  const [isDownloading, setIsDownloading] = React.useState(false)

  React.useEffect(() => {
    if (!id) {
      setNotFound(true)
      setIsLoading(false)
      return
    }

    let cancelled = false

    void (async () => {
      try {
        const data = await getShare(id)
        if (!cancelled) {
          setShare(data)
          setNotFound(false)
        }
      } catch {
        if (!cancelled) {
          setNotFound(true)
          setShare(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [id])

  const onCopyLink = async () => {
    if (!id) return
    await navigator.clipboard.writeText(sharePageUrl(id))
    toast.success("Copied")
  }

  const onDownload = async () => {
    if (!id) return

    setIsDownloading(true)
    try {
      const { url } = await getDownloadUrl(id)
      window.location.assign(url)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Download failed")
    } finally {
      setIsDownloading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (notFound || !share) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col px-4 py-6">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Link expired</EmptyTitle>
            <EmptyDescription>
              This file was deleted after its retention period.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <NewUploadLink />
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle className="truncate">{share.filename}</CardTitle>
          <CardDescription>
            {formatBytes(share.size)} · {formatTimeRemaining(share.expiresAt)}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-2">
          <Button
            className="w-full"
            disabled={isDownloading}
            onClick={() => void onDownload()}
          >
            {isDownloading ? (
              <>
                <Spinner data-icon="inline-start" />
                …
              </>
            ) : (
              <>
                <Download data-icon="inline-start" />
                Download
              </>
            )}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => void onCopyLink()}
          >
            <Copy data-icon="inline-start" />
            Copy link
          </Button>
          <NewUploadLink />
        </CardFooter>
      </Card>
    </div>
  )
}
