import { Spinner } from "@transferflow/ui/components/spinner"
import { lazy, Suspense, useEffect } from "react"
import { BrowserRouter, Route, Routes } from "react-router-dom"

import { AppShell } from "@/components/app-shell"
import { activateInternalKeyOnLoad } from "@/lib/activate-internal-key"

const HomePage = lazy(() =>
  import("@/pages/home-page").then((module) => ({ default: module.HomePage }))
)
const DownloadPage = lazy(() =>
  import("@/pages/download-page").then((module) => ({
    default: module.DownloadPage,
  }))
)

function RouteFallback() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <Spinner className="size-8" />
    </div>
  )
}

export function App() {
  useEffect(() => {
    void activateInternalKeyOnLoad()
  }, [])

  return (
    <BrowserRouter>
      <AppShell>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/d/:id" element={<DownloadPage />} />
          </Routes>
        </Suspense>
      </AppShell>
    </BrowserRouter>
  )
}
