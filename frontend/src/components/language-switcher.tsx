"use client"

import * as React from "react"
import { Languages } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTranslation } from "@/hooks/use-translation"
import type { Locale } from "@/contexts/language-context"

const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  fr: "Français",
}

interface LanguageSwitcherProps {
  variant?: "outline" | "ghost" | "default"
}

export function LanguageSwitcher({ variant = "outline" }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useTranslation("languageSwitcher")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size="icon" className="cursor-pointer" aria-label={t("label")}>
          <Languages className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(Object.keys(LOCALE_LABELS) as Locale[]).map((code) => (
          <DropdownMenuItem
            key={code}
            onClick={() => setLocale(code)}
            className={code === locale ? "font-medium" : ""}
          >
            {LOCALE_LABELS[code]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
