"use client"

import * as React from "react"
import { SharedHeader } from "@/components/shared-header"

export function SiteHeader() {
  return (
    <SharedHeader
      showSearch
      showNotifications
      showModeToggle
      notificationButtonVariant="outline"
    />
  )
}