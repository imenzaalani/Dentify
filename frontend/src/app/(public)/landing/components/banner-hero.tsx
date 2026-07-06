import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

interface CtaLink {
  href: string
  label: string
  variant?: "solid" | "outline"
}

interface BannerHeroProps {
  eyebrow: string
  title: React.ReactNode
  description: string
  primaryCta: CtaLink
  secondaryCta: CtaLink
}

export function BannerHero({ eyebrow, title, description, primaryCta, secondaryCta }: BannerHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-b-[2.5rem] bg-[#0a1224] pb-28 pt-40 text-white shadow-[0_30px_70px_-25px_rgba(10,18,36,0.45)] dark:bg-[linear-gradient(135deg,#0f5ebd_0%,#1683f0_45%,#5fb8ff_100%)] dark:shadow-[0_40px_90px_-20px_rgba(0,0,0,0.5)]">
      {/* Glow accents — light mode only, navy treatment */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(56,130,246,0.20),_transparent_45%),radial-gradient(circle_at_85%_60%,_rgba(96,165,250,0.12),_transparent_30%)] dark:hidden" />

      {/* Grid texture — present in both, slightly stronger in dark mode to stay visible on lighter blue */}
      <div
        aria-hidden
        className="absolute inset-0 dark:hidden"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 0%, black, transparent)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 0%, black, transparent)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 hidden dark:block"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Side vignettes — dark mode only, matches homepage hero depth treatment */}
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[26%] bg-[radial-gradient(circle_at_left,rgba(0,0,0,0.18),transparent_55%)] dark:block" />
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[26%] bg-[radial-gradient(circle_at_right,rgba(0,0,0,0.18),transparent_55%)] dark:block" />

      {/* Edge definition where the rounded bottom meets the page */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent dark:via-white/15" />

      <div className="relative mx-auto max-w-7xl px-6">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-300 dark:text-white/70">
          {eyebrow}
        </p>

        <h1
          className="mt-4 max-w-3xl text-5xl font-light leading-[1.1] tracking-tight sm:text-6xl dark:[text-shadow:0_2px_12px_rgba(0,0,0,0.2),0_6px_20px_rgba(0,0,0,0.12)]"
        >
          {title}
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-400 dark:text-white/70">
          {description}
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Link
            href={primaryCta.href}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-slate-950 transition hover:bg-slate-200 dark:text-[#0a1224] dark:shadow-[0_0_30px_rgba(255,255,255,0.25)] dark:hover:scale-[1.03]"
          >
            {primaryCta.label}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link
            href={secondaryCta.href}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10 dark:border-white/25"
          >
            {secondaryCta.label}
          </Link>
        </div>
      </div>
    </section>
  )
}