import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { Toaster } from "sonner"

import "@workspace/ui/globals.css"
import { App } from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
      <Toaster richColors closeButton />
    </ThemeProvider>
  </StrictMode>
)
