import { Link } from "react-router-dom"

import { cn } from "@transferflow/ui/lib/utils"
import { Separator } from "@transferflow/ui/components/separator"
import { BRAM_SUURD_URL, GITHUB_URL } from "@transferflow/shared"

import { UploadHistoryMenu } from "@/components/upload-history-menu"

export function AppShell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex min-h-svh flex-col lg:flex-row", className)}>
      <div className="flex min-h-svh flex-1 flex-col lg:w-1/2 lg:min-w-0">
        <header className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 pt-4 pb-2">
          <div aria-hidden className="size-8" />
          <Link
            to="/"
            className="justify-self-center text-lg font-semibold tracking-tight transition-opacity hover:opacity-80"
          >
            TransferFlow
          </Link>
          <div className="flex justify-end">
            <UploadHistoryMenu />
          </div>
        </header>
        <main className="flex min-h-0 flex-1 flex-col justify-center">
          {children}
        </main>
        <footer className="flex shrink-0 justify-center gap-2 px-4 py-6 text-center text-xs text-muted-foreground">
          <div className="shrink-0">
            Made by{" "}
            <a
              href={BRAM_SUURD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-4 hover:underline"
            >
              Bram Suurd
            </a>{" "}
          </div>
          <Separator orientation="vertical" />
          <div>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-4 hover:underline"
            >
              Github
            </a>
          </div>
        </footer>
      </div>
      <aside
        aria-hidden
        className="hidden lg:block lg:h-svh lg:w-1/2 lg:shrink-0"
      >
        <img
          src="/image.webp"
          alt=""
          className="size-full object-cover object-bottom"
        />
      </aside>
    </div>
  )
}
