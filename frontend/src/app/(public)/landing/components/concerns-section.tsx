"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { MapPin, Check } from "lucide-react"
import { Reveal, Stagger, itemVariants } from "./primitives"

export function ConcernsSection() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" })
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (form.name.trim().length < 2) return setError("Please enter your name.")
    if (!/\S+@\S+\.\S+/.test(form.email)) return setError("Please enter a valid email.")
    setSent(true)
  }

  return (
    <section id="concerns" className="relative z-10 px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-50 dark:bg-[oklch(0.18_0.06_230)] p-8 text-slate-950 dark:text-white sm:p-14">
            {/* Blobs */}
            <div
              aria-hidden
              className="absolute -top-32 -right-32 h-[400px] w-[400px] rounded-full bg-primary/30 blur-[120px] pointer-events-none"
            />
            <div
              aria-hidden
              className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-[oklch(0.65_0.18_230)]/25 blur-[120px] pointer-events-none"
            />

            <div className="relative grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
              {/* Left — contacts */}
              <div>
                <div className="mb-3 text-xs uppercase tracking-[0.22em] text-slate-600 dark:text-white/60">
                  — Talk to us
                </div>
                <h2 className="text-5xl font-light leading-[1] tracking-tight sm:text-6xl text-balance text-slate-950 dark:text-white">
                  Talk to us about your dental concerns
                </h2>
                <p className="mt-6 max-w-md text-slate-700 dark:text-white/70">
                  Choose a location or send us a quick note — we&apos;re happy to help.
                </p>

                <Stagger className="mt-10 grid gap-4">
                  {[
                    {
                      city: "New York, NY",
                      address: "123 Smile Street, Suite 101, New York, NY 10001",
                    },
                    {
                      city: "Los Angeles, CA",
                      address: "456 Bright Avenue, Building B, Los Angeles, CA 90012",
                    },
                  ].map((loc) => (
                    <motion.div key={loc.city} variants={itemVariants} className="flex gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-slate-950 dark:text-white">{loc.city}</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{loc.address}</p>
                      </div>
                    </motion.div>
                  ))}
                </Stagger>
              </div>

              {/* Right — simple form */}
              <div>
                <form onSubmit={onSubmit} className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/8 p-6 backdrop-blur-md sm:p-8 text-slate-950 dark:text-white">
                  {sent ? (
                    <div className="flex flex-col items-center gap-4 py-12 text-center">
                      <div className="grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-6 w-6" />
                      </div>
                      <div className="text-3xl font-semibold text-slate-950 dark:text-white">Message sent</div>
                      <p className="max-w-sm text-sm text-slate-700 dark:text-white/70">Thanks — we&apos;ll get back to you shortly.</p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div>
                        <label className="mb-1.5 block text-xs uppercase tracking-wider text-slate-600 dark:text-white/60">Full name</label>
                        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm text-slate-950 dark:text-white outline-none" />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs uppercase tracking-wider text-slate-600 dark:text-white/60">Email</label>
                        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm text-slate-950 dark:text-white outline-none" />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs uppercase tracking-wider text-slate-600 dark:text-white/60">Phone</label>
                        <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm text-slate-950 dark:text-white outline-none" />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs uppercase tracking-wider text-slate-600 dark:text-white/60">Message</label>
                        <textarea rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full resize-none rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm text-slate-950 dark:text-white outline-none" />
                      </div>

                      {error && <div className="rounded-lg bg-red-100 dark:bg-white/10 px-3 py-2 text-xs text-red-700 dark:text-white">{error}</div>}

                      <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground">Send message</button>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export default ConcernsSection
