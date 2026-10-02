import * as React from "react"
import { LanguageProviderContext } from "@/contexts/language-context"

function resolve(messages: Record<string, unknown>, key: string): string | undefined {
  const value = key
    .split(".")
    .reduce<unknown>((acc, part) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[part] : undefined), messages)
  return typeof value === "string" ? value : undefined
}

/**
 * useTranslation("nav")  ->  t("dashboard")  looks up messages.nav.dashboard
 * useTranslation()       ->  t("nav.dashboard") also works with the full path
 */
export function useTranslation(namespace?: string) {
  const context = React.useContext(LanguageProviderContext)

  if (context === undefined) {
    throw new Error("useTranslation must be used within a LanguageProvider")
  }

  const { locale, setLocale, messages } = context

  const t = React.useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const fullKey = namespace ? `${namespace}.${key}` : key
      const template = resolve(messages, fullKey) ?? fullKey
      if (!vars) return template
      return Object.entries(vars).reduce(
        (acc, [name, val]) => acc.replaceAll(`{${name}}`, String(val)),
        template
      )
    },
    [messages, namespace]
  )

  return { t, locale, setLocale }
}
