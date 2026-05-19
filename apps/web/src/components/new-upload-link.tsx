import { Button } from "@transferflow/ui/components/button"
import { cn } from "@transferflow/ui/lib/utils"
import { Link } from "react-router-dom"

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
    >
      New upload
    </Button>
  )
}
