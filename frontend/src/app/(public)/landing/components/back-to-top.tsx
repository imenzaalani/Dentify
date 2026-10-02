"use client"

import { useEffect, useState } from "react"
import { ChevronUp } from "lucide-react"

/** Keep this fixed control outside positioned sections so it stays above them. */
export function BackToTop() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.3)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      tabIndex={show ? 0 : -1}
      style={{
        right: "max(1.5rem, env(safe-area-inset-right))",
        bottom: "max(1.5rem, env(safe-area-inset-bottom))",
      }}
      className={`fixed z-[60] flex h-14 w-14 items-center justify-center rounded-full border border-primary/40 bg-primary text-primary-foreground shadow-2xl transition-[opacity,transform] duration-200 ${
        show
          ? "translate-y-0 scale-100 opacity-100"
          : "pointer-events-none translate-y-6 scale-95 opacity-0"
      }`}
    >
      <ChevronUp className="h-6 w-6" />
    </button>
  )
}