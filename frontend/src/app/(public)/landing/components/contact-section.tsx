"use client"

import { useState } from "react"
import { Phone, Mail, MapPin, Clock, Calendar as CalendarIcon, ArrowUpRight } from "lucide-react"
import { motion } from "motion/react"
import { Reveal, Stagger, itemVariants } from "./primitives"

const ADDRESS = "240 Mercer Street, New York, NY"
const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ADDRESS)}`
const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(ADDRESS)}&output=embed`

const details = [
  { icon: Phone, label: "Phone", value: "+1 (415) 555-0182", href: "tel:+14155550182" },
  { icon: Mail, label: "Email", value: "hello@dentify.clinic", href: "mailto:hello@dentify.clinic" },
  { icon: MapPin, label: "Studio", value: "240 Mercer Street, Floor 4 · New York", href: directionsUrl },
  { icon: Clock, label: "Hours", value: "Mon–Sat · 8:00 – 19:00", href: undefined },
]

function DetailsCard({ showForm }: { showForm: boolean }) {
  return (
    <div className="flex h-full flex-col gap-10 rounded-[2rem] border border-border bg-card p-8 shadow-[0_30px_80px_-40px_oklch(0.16_0.04_265/0.3)] dark:border-white/15 dark:bg-[oklch(0.16_0.05_220)] sm:p-10">
      <Stagger className="space-y-6" delay={0.08}>
        {details.map((d) => {
          const Inner = (
            <>
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-muted text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <d.icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {d.label}
                </div>
                <div className="mt-1 text-base font-medium text-foreground">
                  {d.value}
                </div>
              </div>
            </>
          )
          return (
            <motion.div key={d.label} variants={itemVariants}>
              {d.href ? (
                <a
                  href={d.href}
                  target={d.href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  className="group flex items-center gap-4"
                >
                  {Inner}
                </a>
              ) : (
                <div className="group flex items-center gap-4">{Inner}</div>
              )}
            </motion.div>
          )
        })}
      </Stagger>

      <div className="mt-auto flex flex-wrap gap-3 border-t border-border pt-8">
        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-transform hover:scale-[1.03]"
        >
          <MapPin className="h-4 w-4" />
          Get directions
        </a>
        {!showForm && (
          <a
            href="/booking"
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            <CalendarIcon className="h-4 w-4" />
            Book a visit
          </a>
        )}
      </div>
    </div>
  )
}

function MapCard() {
  return (
    <div className="relative h-full min-h-[420px] overflow-hidden rounded-[2rem] border border-border shadow-[0_30px_80px_-40px_oklch(0.16_0.04_265/0.3)] dark:border-white/15">
      <iframe
        title="Dentify location map"
        src={mapSrc}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="absolute inset-0 h-full w-full grayscale-[0.2]"
        style={{ border: 0 }}
        allowFullScreen
      />
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />
      {/* Bottom-left placement — clear of Google's own top-left marker popup */}
      <div className="pointer-events-none absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-6">
        <div className="pointer-events-auto inline-block max-w-xs rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-lg backdrop-blur dark:bg-[oklch(0.16_0.05_220)]/95">
          <p className="text-sm font-semibold text-foreground">Dentify Dental Studio</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{ADDRESS}</p>
        </div>
      </div>
    </div>
  )
}

export function ContactSection({ showForm = false }: { showForm?: boolean }) {
  const [submitted, setSubmitted] = useState(false)

  return (
    <section id="contact" className="relative z-10 px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 max-w-3xl">
          <Reveal>
            <div className="mb-3 text-xs uppercase tracking-[0.22em] text-primary">— Visit us</div>
            <h2 className="text-5xl font-light leading-[1] tracking-tight sm:text-6xl text-balance">
              Find the studio.
            </h2>
            <p className="mt-6 max-w-lg text-muted-foreground dark:text-foreground/70">
              Two blocks from Washington Square, with valet parking around the
              corner and a quiet entrance through the courtyard.
            </p>
          </Reveal>
        </div>

        {!showForm ? (
          /* No form: details + map side by side, like before */
          <Reveal delay={0.1}>
            <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
              <DetailsCard showForm={false} />
              <MapCard />
            </div>
          </Reveal>
        ) : (
          /* With form: details + form side by side, map full width below */
          <>
            <div className="grid gap-5 lg:grid-cols-[0.85fr_1fr]">
              <Reveal delay={0.1}>
                <DetailsCard showForm={true} />
              </Reveal>

              <Reveal delay={0.15}>
                <div className="flex h-full flex-col gap-5 rounded-[2rem] border border-border bg-card p-8 shadow-[0_30px_80px_-40px_oklch(0.16_0.04_265/0.3)] dark:border-white/15 dark:bg-[oklch(0.16_0.05_220)] sm:p-10">
                  <div>
                    <h3 className="text-xl font-medium">Start your visit</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Tell us a little about what you need and our team will be in touch shortly.
                    </p>
                  </div>

                  {submitted ? (
                    <div className="flex flex-1 items-center justify-center rounded-2xl border border-border bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
                      Thanks — we&apos;ll be in touch soon.
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        setSubmitted(true)
                      }}
                      className="flex flex-1 flex-col gap-3"
                    >
                      <input
                        required
                        placeholder="Your name"
                        className="w-full rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm outline-none focus:border-primary"
                      />
                      <input
                        required
                        type="email"
                        placeholder="Your email"
                        className="w-full rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm outline-none focus:border-primary"
                      />
                      <textarea
                        required
                        placeholder="How can we help?"
                        className="min-h-28 w-full flex-1 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm outline-none focus:border-primary"
                      />
                      <button
                        type="submit"
                        className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition-transform hover:scale-[1.02]"
                      >
                        Send message
                        <ArrowUpRight className="h-4 w-4" />
                      </button>
                    </form>
                  )}
                </div>
              </Reveal>
            </div>

            <Reveal delay={0.2}>
              <div className="mt-5">
                <MapCard />
              </div>
            </Reveal>
          </>
        )}
      </div>
    </section>
  )
}