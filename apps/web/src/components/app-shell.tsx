import { Link } from "react-router-dom"

import { cn } from "@transferflow/ui/lib/utils"

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
    <div className={cn("flex min-h-svh flex-col lg:flex-row", className)}>
      <div className="flex min-h-svh flex-1 flex-col lg:w-1/2 lg:min-w-0">
        <header className="flex shrink-0 justify-center px-4 pt-8 pb-2">
          <Link
            to="/"
            className="text-lg font-semibold tracking-tight transition-opacity hover:opacity-80"
          >
            TransferFlow
          </Link>
        </header>
        <main className="flex min-h-0 flex-1 flex-col justify-center">
          {children}
        </main>
        <footer className="shrink-0 px-4 py-6 text-center text-xs text-muted-foreground">
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
