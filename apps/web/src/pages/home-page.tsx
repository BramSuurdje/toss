import { MAX_FILE_SIZE_BYTES, type Retention } from "@workspace/shared"
import { Upload, X } from "lucide-react"
import * as React from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardFooter } from "@workspace/ui/components/card"
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadList,
  FileUploadTrigger,
} from "@workspace/ui/components/file-upload"
import { Label } from "@workspace/ui/components/label"
import { Progress } from "@workspace/ui/components/progress"
import { RadioGroup, RadioGroupItem } from "@workspace/ui/components/radio-group"
import { Spinner } from "@workspace/ui/components/spinner"

import {
  completeShare,
  createShare,
  uploadShareFile,
} from "@/lib/api"

export function HomePage() {
  const navigate = useNavigate()
  const [files, setFiles] = React.useState<File[]>([])
  const [retention, setRetention] = React.useState<Retention>("24h")
  const [isUploading, setIsUploading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const [uploadLabel, setUploadLabel] = React.useState("")

  const file = files[0] ?? null

  const onFileReject = React.useCallback((rejected: File, message: string) => {
    toast.error(message, { description: rejected.name })
  }, [])

  const onShare = async () => {
    if (!file) {
      toast.error("Choose a file")
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setUploadLabel("Preparing…")

    try {
      const created = await createShare({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        size: file.size,
        retention,
      })

      setUploadProgress(8)
      setUploadLabel("Uploading…")

      const parts = await uploadShareFile(created, file, (percent) => {
        setUploadProgress(8 + Math.round(percent * 0.87))
      })

      setUploadProgress(96)
      setUploadLabel("Finishing…")
      await completeShare(created.id, parts)
      setUploadProgress(100)
      navigate(`/d/${created.id}`, { replace: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed")
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      setUploadLabel("")
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-6">
      <p className="text-muted-foreground text-center text-sm">
        Upload a file, pick how long the link works, and share it. No account.
      </p>

      <Card>
        <CardContent className="flex flex-col gap-6 pt-6">
          <FileUpload
            maxFiles={1}
            maxSize={MAX_FILE_SIZE_BYTES}
            value={files}
            disabled={isUploading}
            onValueChange={setFiles}
            onFileReject={onFileReject}
          >
            <FileUploadDropzone className="min-h-36">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex items-center justify-center rounded-full border p-2.5">
                  <Upload />
                </div>
                <p className="text-sm font-medium">Drop a file here</p>
                <p className="text-muted-foreground text-xs">
                  Up to 500 MB. Large files upload in parallel parts.
                </p>
                <FileUploadTrigger asChild>
                  <Button variant="outline" type="button" size="sm">
                    Browse
                  </Button>
                </FileUploadTrigger>
              </div>
            </FileUploadDropzone>

            {file ? (
              <FileUploadList>
                <FileUploadItem value={file}>
                  <FileUploadItemPreview />
                  <FileUploadItemMetadata />
                  <FileUploadItemDelete asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0"
                      type="button"
                    >
                      <X />
                      <span className="sr-only">Remove file</span>
                    </Button>
                  </FileUploadItemDelete>
                </FileUploadItem>
              </FileUploadList>
            ) : null}
          </FileUpload>

          <RadioGroup
            value={retention}
            onValueChange={(value) => setRetention(value as Retention)}
            className="flex gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="24h" id="retention-24h" />
              <Label htmlFor="retention-24h">24 hours</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="7d" id="retention-7d" />
              <Label htmlFor="retention-7d">7 days</Label>
            </div>
          </RadioGroup>
          {isUploading ? (
            <div className="flex flex-col gap-2">
              <div className="text-muted-foreground flex justify-between text-xs">
                <span>{uploadLabel}</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            className="w-full"
            disabled={!file || isUploading}
            onClick={() => void onShare()}
          >
            {isUploading ? (
              <>
                <Spinner data-icon="inline-start" />
                Uploading
              </>
            ) : (
              "Upload"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
