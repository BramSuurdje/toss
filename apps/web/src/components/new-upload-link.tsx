import { Link } from "react-router-dom"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export function NewUploadLink({
  className,
  variant = "ghost",
}: {
  className?: string
  variant?: "ghost" | "outline"
}) {
  return (
    <Button
      variant={variant}
      className={cn("w-full", className)}
      render={<Link to="/" />}
      nativeButton={false}
    >
      New upload
    </Button>
  )
}
