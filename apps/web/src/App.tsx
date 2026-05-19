import { BrowserRouter, Route, Routes } from "react-router-dom"

import { AppShell } from "@/components/app-shell"
import { DownloadPage } from "@/pages/download-page"
import { HomePage } from "@/pages/home-page"

export function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/d/:id" element={<DownloadPage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}
