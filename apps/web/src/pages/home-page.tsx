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
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group"
import { Spinner } from "@workspace/ui/components/spinner"

import { completeShare, createShare } from "@/lib/api"
import { uploadShare } from "@/lib/upload"

type UploadUiState = {
  isUploading: boolean
  progress: number
  label: string
}

type UploadUiAction =
  | { type: "start" }
  | { type: "progress"; progress: number; label: string }
  | { type: "reset" }

const initialUploadUi: UploadUiState = {
  isUploading: false,
  progress: 0,
  label: "",
}

function uploadUiReducer(
  state: UploadUiState,
  action: UploadUiAction
): UploadUiState {
  switch (action.type) {
    case "start":
      return { isUploading: true, progress: 0, label: "Preparing…" }
    case "progress":
      return {
        ...state,
        progress: action.progress,
        label: action.label,
      }
    case "reset":
      return initialUploadUi
    default:
      return state
  }
}

export function HomePage() {
  const navigate = useNavigate()
  const [files, setFiles] = React.useState<File[]>([])
  const [retention, setRetention] = React.useState<Retention>("24h")
  const [uploadUi, dispatchUploadUi] = React.useReducer(
    uploadUiReducer,
    initialUploadUi
  )

  const file = files[0] ?? null

  const onFileReject = React.useCallback((rejected: File, message: string) => {
    toast.error(message, { description: rejected.name })
  }, [])

  const onShare = async () => {
    if (!file) {
      toast.error("Choose a file")
      return
    }

    dispatchUploadUi({ type: "start" })

    try {
      const { id, upload } = await createShare({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        size: file.size,
        retention,
      })

      dispatchUploadUi({
        type: "progress",
        progress: 8,
        label: "Uploading…",
      })

      const parts = await uploadShare(file, upload, (percent) => {
        dispatchUploadUi({
          type: "progress",
          progress: 8 + Math.round(percent * 0.87),
          label: "Uploading…",
        })
      })

      dispatchUploadUi({
        type: "progress",
        progress: 96,
        label: "Finishing…",
      })
      await completeShare(id, parts)
      dispatchUploadUi({
        type: "progress",
        progress: 100,
        label: "Finishing…",
      })
      navigate(`/d/${id}`, { replace: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed")
    } finally {
      dispatchUploadUi({ type: "reset" })
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-6">
      <p className="text-center text-sm text-muted-foreground">
        Upload a file, pick how long the link works, and share it. No account.
      </p>

      <Card>
        <CardContent className="flex flex-col gap-6 pt-6">
          <FileUpload
            maxFiles={1}
            maxSize={MAX_FILE_SIZE_BYTES}
            value={files}
            disabled={uploadUi.isUploading}
            onValueChange={setFiles}
            onFileReject={onFileReject}
          >
            <FileUploadDropzone className="min-h-36">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex items-center justify-center rounded-full border p-2.5">
                  <Upload />
                </div>
                <p className="text-sm font-medium">Drop a file here</p>
                <p className="text-xs text-muted-foreground">
                  Any file up to 500 MB. No apps, scripts, or installers.
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

          <div className="flex flex-col gap-3">
            <Label htmlFor="retention">
              How long should the link be valid?
            </Label>
            <RadioGroup
              id="retention"
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
          </div>
          {uploadUi.isUploading ? (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{uploadUi.label}</span>
                <span>{uploadUi.progress}%</span>
              </div>
              <Progress value={uploadUi.progress} />
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            className="w-full"
            disabled={!file || uploadUi.isUploading}
            onClick={() => void onShare()}
          >
            {uploadUi.isUploading ? (
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
