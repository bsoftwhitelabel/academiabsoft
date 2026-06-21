import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { BrowserRouter } from "react-router-dom"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"
import { App } from "./App"
import { TenantThemeProvider } from "@/components/layout/TenantThemeProvider"
import { queryClient } from "@/lib/query-client"
import "@/styles/globals.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <BrowserRouter>
          <TenantThemeProvider>
            <App />
          </TenantThemeProvider>
        </BrowserRouter>
        <Toaster richColors position="top-right" />
        {import.meta.env.DEV ? (
          <ReactQueryDevtools initialIsOpen={false} />
        ) : null}
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
)
