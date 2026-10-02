"use client"

import { useState } from "react"
import { Smile, Mail, ArrowUpRight } from "lucide-react"
import { Logo } from "@/components/logo"

const links: [string, string[]][] = [
  ["Navigation", ["Home", "Services", "Doctors", "Results", "Contact"]],
  ["Company", ["About Us", "Pricing", "Insurance", "Careers"]],
  ["Legal", ["Privacy Policy", "Terms of Use", "Accessibility"]],
]

const socials = [
  {
    label: "Facebook",
    path: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z",
  },
  {
    label: "Instagram",
    path: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01M6.5 6.5a11 11 0 0 0 0 11h11a11 11 0 0 0 0-11z",
  },
  {
    label: "Twitter / X",
    path: "M4 4l16 16M4 20L20 4",
  },
  {
    label: "TikTok",
    path: "M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5",
  },
]

export function LandingFooter() {
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)

  return (
    <footer className="relative z-10 overflow-hidden rounded-t-[2.5rem] bg-white text-slate-950 shadow-[0_-25px_60px_-20px_rgba(15,23,42,0.18)] dark:bg-[#0a1f3d] dark:text-white dark:shadow-[0_-25px_70px_-20px_rgba(0,0,0,0.6)]">
      {/* Background layers — only active in dark mode */}
      <div className="absolute inset-0 bg-[radial-gradient(at_50%_20%,rgba(91,192,255,0.12),transparent_50%)] dark:block hidden" />

      <div
        className="absolute inset-0 hidden dark:block bg-[linear-gradient(180deg,
          rgba(10,30,68,0.98) 0%,
          rgba(12,48,95,0.95) 25%,
          rgba(15,69,128,0.92) 50%,
          rgba(11,45,88,0.94) 75%,
          rgba(9,25,55,0.98) 100%
        )]"
      />

      {/* Light-mode wash — soft sky tint instead of navy */}
      <div className="absolute inset-0 bg-[radial-gradient(at_50%_0%,rgba(56,130,246,0.06),transparent_55%)] dark:hidden" />

      {/* Ambient blobs for depth — dark mode only */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden hidden dark:block">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(91,192,255,0.20),transparent_70%)]" />
        <div className="absolute top-12 -right-32 h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,rgba(91,192,255,0.28),transparent_70%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[420px] bg-[radial-gradient(circle_at_50%_90%,rgba(91,192,255,0.18),transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_0.8px,transparent_1px)] [background-size:60px_60px] opacity-[0.035]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 pt-16">
        {/* Newsletter — centered, contained, feels designed rather than stretched */}
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 pb-16 text-center">
          <h2 className="text-3xl font-light sm:text-4xl text-slate-950 dark:text-white">
            Subscribe to our newsletter.
          </h2>
          <p className="text-sm text-slate-500 dark:text-white/50">
            Tips on dental care, studio updates, and the occasional offer — no spam.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (email) setSubscribed(true)
            }}
            className="flex w-full max-w-md items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-2 backdrop-blur-xl max-md:backdrop-blur-none dark:border-white/15 dark:bg-white/5"
          >
            <Mail className="ml-3 h-4 w-4 shrink-0 text-slate-400 dark:text-white/40" />
            {subscribed ? (
              <span className="flex-1 px-2 text-left text-sm text-slate-500 dark:text-white/60">
                Thanks for subscribing!
              </span>
            ) : (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-1 bg-transparent px-2 text-left text-sm text-slate-950 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-white/35"
              />
            )}
            <button
              type="submit"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#0f3d70] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#0b325f] dark:bg-[#5bc0ff] dark:text-[#0a1f3d]"
            >
              <ArrowUpRight className="h-4 w-4" />
              Subscribe
            </button>
          </form>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-white/20" />

        {/* Main grid */}
        <div className="grid grid-cols-1 gap-12 py-16 lg:grid-cols-[1.2fr_2fr]">
          {/* Logo + tagline */}
          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[#0f3d70] dark:bg-[#5bc0ff]">
                <Logo className="h-5 w-5 text-white dark:text-[#0a1f3d]" />
              </div>
              <span className="text-2xl font-semibold">Dentify</span>
            </div>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-slate-500 dark:text-white/60">
              Advanced technology, a caring team, and treatments designed to
              keep your smile healthy for life. Book your consultation today —
              we&apos;re ready when you are.
            </p>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {links.map(([h, items]) => (
              <div key={h}>
                <div className="mb-5 text-sm font-medium text-slate-950 dark:text-white">{h}</div>
                <ul className="space-y-3.5">
                  {items.map((item) => {
                    const href =
                      item === 'Home'
                        ? '/'
                        : item === 'Services'
                          ? '/services'
                          : item === 'Doctors'
                            ? '/doctors'
                            : item === 'About Us'
                              ? '/about'
                              : item === 'Contact'
                                ? '/contact'
                                : '#'

                    return (
                      <li key={item}>
                        <a
                          href={href}
                          className="text-sm text-slate-500 transition-colors hover:text-slate-950 dark:text-white/60 dark:hover:text-white"
                        >
                          {item}
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-200 py-8 dark:border-white/10">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <span className="text-xs text-slate-400 dark:text-white/35">
              © {new Date().getFullYear()} Dentify Dental Studio. All
              rights reserved.
            </span>

            {/* Social icons */}
            <div className="flex items-center gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-400 transition-colors hover:border-slate-400 hover:text-slate-950 dark:border-white/15 dark:text-white/50 dark:hover:border-white/40 dark:hover:text-white"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-white/35">
              <a href="#" className="hover:text-slate-950 dark:hover:text-white transition-colors">
                Privacy policy
              </a>
              <span>·</span>
              <a href="#" className="hover:text-slate-950 dark:hover:text-white transition-colors">
                Terms of use
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}