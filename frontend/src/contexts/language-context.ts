import * as React from "react"

export type Locale = "en" | "fr"

export type Messages = Record<string, unknown>

type LanguageContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  messages: Messages
}

export const LanguageProviderContext = React.createContext<LanguageContextValue | undefined>(
  undefined
)
