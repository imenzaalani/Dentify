"use client"

import { useEffect, useState } from "react"

export default function Loading() {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const checkTheme = () => {
      const stored = localStorage.getItem("nextjs-ui-theme")
      const htmlHasDark = document.documentElement.classList.contains("dark")

      setIsDark(stored === "dark" || htmlHasDark)
    }

    checkTheme()
    setMounted(true)

    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  if (!mounted) return null

  return (
    <div
      className={`relative flex min-h-screen items-center justify-center overflow-hidden transition-colors duration-300 ${
        isDark ? "bg-[linear-gradient(135deg,#07111f_0%,#0f2b4d_45%,#133e67_100%)]" : "bg-[linear-gradient(135deg,oklch(0.97_0.01_250)_0%,oklch(0.94_0.02_240)_45%,oklch(0.92_0.03_255)_100%)]"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2),transparent_60%)] opacity-70" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:44px_44px]" />

      <div className="relative z-10 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-transparent border-t-sky-400 border-r-sky-300" />
        </div>

        <p className={`text-sm font-medium uppercase tracking-[0.35em] ${isDark ? "text-slate-300" : "text-slate-600"}`}>
          Preparing your experience
        </p>
        <p className={`mt-2 text-base ${isDark ? "text-slate-400" : "text-slate-600"}`}>
          Just a moment while we get everything ready.
        </p>
      </div>
    </div>
  )
}
