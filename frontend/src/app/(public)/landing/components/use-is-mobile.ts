"use client"

import { useEffect, useState } from "react"

/**
 * true on phones (< 768px), false on larger screens.
 * Returns null until the first client-side check, so callers can avoid
 * mounting heavy desktop-only effects for a frame on mobile.
 */
export function useIsMobile(): boolean | null {
  const [isMobile, setIsMobile] = useState<boolean | null>(null)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])
  return isMobile
}
