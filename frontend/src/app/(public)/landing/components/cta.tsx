"use client"

import { ArrowUpRight } from "lucide-react"
import { Reveal } from "./primitives"
import Link from "next/link"

interface CtaLink {
  href: string
  label: string
}

interface CTASectionProps {
  title?: React.ReactNode
  primaryCta?: CtaLink
  secondaryCta?: CtaLink
}

export function CTASection({
  title = (
    <>
      Come see the studio. <span className="italic text-background/80 dark:text-white/80">Coffee&apos;s on us.</span>
    </>
  ),
  primaryCta = { href: "/booking", label: "Book a visit" },
  secondaryCta = { href: "/doctors", label: "Meet the team" },
}: CTASectionProps) {
  return (
    <section className="relative z-10 px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-foreground p-10 text-background noise sm:p-16 dark:bg-[linear-gradient(135deg,#0f5ebd_0%,#1683f0_45%,#5fb8ff_100%)] dark:text-white">
            {/* Light-mode glow blobs */}
            <div aria-hidden className="absolute -top-32 -right-32 h-[400px] w-[400px] rounded-full bg-primary/40 blur-[120px] max-md:hidden dark:hidden" />
            <div aria-hidden className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-[oklch(0.65_0.18_270)]/40 blur-[120px] max-md:hidden dark:hidden" />

            {/* Dark-mode grid texture + vignettes — matches hero/BannerHero treatment */}
            <div
              aria-hidden
              className="absolute inset-0 hidden dark:block"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
                backgroundSize: "60px 60px",
              }}
            />
            <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 hidden w-[40%] bg-[radial-gradient(circle_at_left,rgba(0,0,0,0.18),transparent_55%)] dark:block" />
            <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-[40%] bg-[radial-gradient(circle_at_right,rgba(0,0,0,0.18),transparent_55%)] dark:block" />

            <div className="relative grid items-end gap-10 md:grid-cols-[1.2fr_0.8fr]">
              <h3 className="font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl text-balance dark:[text-shadow:0_2px_12px_rgba(0,0,0,0.2),0_6px_20px_rgba(0,0,0,0.12)]">
                {title}
              </h3>
              <div className="flex flex-wrap gap-3 md:justify-end">
                <Link
                  href={primaryCta.href}
                  className="inline-flex items-center gap-2 rounded-full bg-background px-6 py-3 text-sm font-medium text-foreground transition-transform hover:scale-[1.03] dark:bg-white dark:text-[#0a1224] dark:shadow-[0_0_30px_rgba(255,255,255,0.25)]"
                >
                  {primaryCta.label} <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link
                  href={secondaryCta.href}
                  className="inline-flex items-center gap-2 rounded-full border border-background/20 px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-background/10 dark:border-white/25 dark:text-white dark:hover:bg-white/10"
                >
                  {secondaryCta.label}
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}