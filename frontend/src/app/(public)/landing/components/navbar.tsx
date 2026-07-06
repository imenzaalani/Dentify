"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { motion } from "motion/react"
import { ArrowUpRight, Phone, User } from "lucide-react"
import { Logo } from "@/components/logo"
import { ModeToggle } from "@/components/mode-toggle"
import { ease } from "./primitives"

// Use ModeToggle for the circular theme transition used in the dashboard

export function LandingNavbar({ lightMode = false }: { lightMode?: boolean }) {
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const trimmedPath = pathname?.replace(/\/$/, "")
  const isLandingPage = trimmedPath === ""
  const isBookingPage = trimmedPath === "/booking"

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24)
    on()
    window.addEventListener("scroll", on, { passive: true })
    return () => window.removeEventListener("scroll", on)
  }, [])

  const baseNavClasses = "max-w-6xl w-full flex items-center justify-between rounded-full px-5 py-3 transition-all duration-300"
  const navStyle = scrolled
    ? "bg-background/80 backdrop-blur-xl border border-border shadow-sm"
    : lightMode
    ? "bg-white/90 border border-slate-200 shadow-sm dark:bg-white/5 dark:border-white/10"
    : "bg-white/5 backdrop-blur-md border border-white/10 dark:bg-white/5 dark:border-white/10"
  const navText = scrolled
    ? "text-muted-foreground"
    : lightMode
    ? "text-slate-950/75 dark:text-white/70"
    : "text-white/70"
  const brandText = scrolled
    ? "text-foreground"
    : lightMode
    ? "text-foreground dark:text-white"
    : "text-white"
  const brandIconStyle = scrolled
    ? "bg-primary text-primary-foreground"
    : lightMode
    ? "bg-slate-950 text-white dark:bg-white/10 dark:text-white"
    : "bg-white text-[oklch(0.16_0.04_265)]"
  const ctaStyle = scrolled
    ? "bg-foreground text-background"
    : lightMode
    ? "bg-slate-950 text-white dark:bg-white/10 dark:text-white"
    : "bg-white text-[oklch(0.16_0.04_265)]"
  // Ghost circular button — mirrors ModeToggle's footprint exactly
  const portalBtnStyle = scrolled
    ? "border-border bg-muted text-muted-foreground hover:text-foreground"
    : lightMode
    ? "border-slate-200 bg-white/5 text-slate-950/75 hover:text-slate-950 dark:border-white/10 dark:text-white/70 dark:hover:text-white"
    : "border-white/10 bg-white/5 text-white/70 hover:text-white"

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4"
    >
      <nav className={`${baseNavClasses} ${navStyle}`}>
        <a href="/" className="flex items-center gap-2">
          <div className={`grid h-8 w-8 place-items-center rounded-full transition-colors ${brandIconStyle}`}>
            <Logo className="h-5 w-5 text-current" />
          </div>
          <span className={`font-semibold text-xl ${brandText}`}>
            Dentify
          </span>
        </a>

        <ul className={`hidden items-center gap-8 text-sm md:flex ${navText}`}>
          {["About", "Services", "Doctors","Contact"].map((l) => (
            <li key={l}>
              <a
                href={
                  l === 'Doctors'
                    ? '/doctors'
                    : l === 'Services'
                    ? '/services'
                    : l === 'About'
                    ? '/about'
                    : l === 'Contact'
                    ? '/contact'
                    : '/'
                }
                className={`relative transition-colors after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:transition-all after:duration-300 hover:after:w-full ${
                  scrolled
                    ? "hover:text-foreground after:bg-primary"
                    : lightMode
                    ? "hover:text-slate-950 after:bg-slate-950 dark:hover:text-white dark:after:bg-white"
                    : "hover:text-white after:bg-white"
                }`}
              >
                {l}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          {/* Patient Portal — icon-only, tooltip on hover, links to /sign-in */}
          <div className="group relative">
            <a
              href="/sign-in"
              aria-label="Patient Portal"
              className={`grid h-9 w-9 place-items-center rounded-full border transition-colors ${portalBtnStyle}`}
            >
              <User className="h-4 w-4" strokeWidth={2} />
            </a>
            <span
              className={`pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-1 text-xs opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${
                scrolled
                  ? "bg-foreground text-background"
                  : "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
              }`}
            >
              Patient Portal
            </span>
          </div>

          <div className={scrolled ? "border-border bg-muted p-0.5 rounded-full" : "p-0.5"}>
            <ModeToggle />
          </div>
          {isBookingPage ? (
            <a
              href="/contact"
              className={`group inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-transform hover:scale-[1.03] ${ctaStyle}`}
            >
              <Phone className="h-3.5 w-3.5" />
              Need help?
            </a>
          ) : (
            <a
              href="/booking"
              className={`group inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-transform hover:scale-[1.03] ${ctaStyle}`}
            >
              Book visit
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          )}
        </div>
      </nav>
    </motion.header>
  )
}