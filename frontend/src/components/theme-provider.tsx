"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes"
import { ThemeProviderContext } from "@/contexts/theme-context"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

function ThemeContextBridge({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useNextTheme()

  const value = React.useMemo(
    () => ({
      theme: (theme as Theme) || "light",
      // next-themes' setTheme accepts 'light' | 'dark' | 'system'
      setTheme: (t: Theme) => setTheme(t),
    }),
    [theme, setTheme]
  )

  return <ThemeProviderContext.Provider value={value}>{children}</ThemeProviderContext.Provider>
}

export function ThemeProvider({ children, defaultTheme = "system", storageKey = "nextjs-ui-theme" }: ThemeProviderProps) {
  return (
    <NextThemesProvider attribute="class" defaultTheme={defaultTheme} storageKey={storageKey} enableSystem>
      <ThemeContextBridge>{children}</ThemeContextBridge>
    </NextThemesProvider>
  )
}
