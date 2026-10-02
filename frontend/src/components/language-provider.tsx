"use client"

import * as React from "react"
import { LanguageProviderContext, type Locale, type Messages } from "@/contexts/language-context"

import en from "@/messages/en.json"
import fr from "@/messages/fr.json"

const ALL_MESSAGES: Record<Locale, Messages> = { en, fr }
export const SUPPORTED_LOCALES: Locale[] = ["en", "fr"]

type LanguageProviderProps = {
  children: React.ReactNode
  defaultLocale?: Locale
  storageKey?: string
}

export function LanguageProvider({
  children,
  defaultLocale = "en",
  storageKey = "nextjs-ui-locale",
}: LanguageProviderProps) {
  const [locale, setLocaleState] = React.useState<Locale>(defaultLocale)

  // Read persisted preference on mount (client only, so it never fights SSR)
  React.useEffect(() => {
    const stored = window.localStorage.getItem(storageKey) as Locale | null
    if (stored && ALL_MESSAGES[stored]) {
      setLocaleState(stored)
      return
    }
    // Fall back to browser language if nothing is stored yet
    const browserLang = window.navigator.language.slice(0, 2) as Locale
    if (ALL_MESSAGES[browserLang]) {
      setLocaleState(browserLang)
    }
  }, [storageKey])

  // Keep <html lang="..."> (and dir, for future RTL locales) in sync
  React.useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = React.useCallback(
    (next: Locale) => {
      window.localStorage.setItem(storageKey, next)
      setLocaleState(next)
    },
    [storageKey]
  )

  const value = React.useMemo(
    () => ({
      locale,
      setLocale,
      messages: ALL_MESSAGES[locale],
    }),
    [locale, setLocale]
  )

  return <LanguageProviderContext.Provider value={value}>{children}</LanguageProviderContext.Provider>
}
