import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { Toaster } from "sonner"

import { fontVariables } from "@workspace/ui/fonts"
import "@workspace/ui/globals.css"

for (const fontClass of fontVariables.split(" ")) {
  document.documentElement.classList.add(fontClass)
}
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
