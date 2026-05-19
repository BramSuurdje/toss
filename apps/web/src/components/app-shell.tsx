import { Link } from "react-router-dom"

import { cn } from "@workspace/ui/lib/utils"

const BRAM_SUURD_URL =
  "https://bramsuurd.nl?utm_source=transferflow&utm_medium=footer&utm_campaign=attribution"

export function AppShell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex min-h-svh flex-col", className)}>
      <header className="flex justify-center px-4 pt-8 pb-2">
        <Link
          to="/"
          className="text-lg font-semibold tracking-tight transition-opacity hover:opacity-80"
        >
          TransferFlow
        </Link>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
      <footer className="text-muted-foreground px-4 py-6 text-center text-xs">
        Made with ❤️ by{" "}
        <a
          href={BRAM_SUURD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-4 hover:underline"
        >
          Bram Suurd
        </a>{" "}
        In 🇳🇱
      </footer>
    </div>
  )
}
