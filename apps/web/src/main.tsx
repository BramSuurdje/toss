import {
  AnchoredToastProvider,
  ToastProvider,
} from "@transferflow/ui/components/toast"
import "@transferflow/ui/globals.css"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { ThemeProvider } from "@/components/theme-provider.tsx"
import { App } from "./App.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <AnchoredToastProvider>
          <App />
        </AnchoredToastProvider>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>
)
