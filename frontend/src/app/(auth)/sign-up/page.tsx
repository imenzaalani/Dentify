"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { ArrowUpRight, Smile, Check } from "lucide-react"
import { ease } from "@/app/(public)/landing/components/primitives"
import { ModeToggle } from "@/components/mode-toggle"
import { AuthBackground } from "../components/auth-background"
import {Logo} from "@/components/logo"
export default function RegisterPage() {
  const [submitting, setSubmitting] = useState(false)

  return (
    <main className="relative flex min-h-screen w-full overflow-hidden bg-[linear-gradient(135deg,oklch(0.16_0.04_265)_0%,oklch(0.22_0.08_240)_50%,oklch(0.18_0.06_260)_100%)] dark:bg-[linear-gradient(135deg,#0f5ebd_0%,#1683f0_45%,#5fb8ff_100%)]">
      <AuthBackground />

      <div className="absolute right-6 top-8 z-10 rounded-full border border-white/10 bg-white/5 p-0.5 backdrop-blur">
        <ModeToggle />
      </div>

      <div className="relative hidden w-[42%] shrink-0 flex-col justify-between px-12 py-10 lg:flex">
        <Link href="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-white text-[oklch(0.16_0.04_265)]">
            <Logo className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-semibold text-white">Dentify</span>
        </Link>

        <div className="relative max-w-sm">
          <p className="font-serif text-3xl italic text-white/90">
            A quiet space for your care, always on hand.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/60">
            {["Book and manage visits", "View treatment plans and records", "Message your care team directly"].map(
              (item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-white/10">
                    <Check className="h-2.5 w-2.5 text-white/70" strokeWidth={3} />
                  </span>
                  {item}
                </li>
              )
            )}
          </ul>
        </div>

        <p className="relative text-xs text-white/40">© {new Date().getFullYear()} Dentify Dental Studio</p>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-6 py-16">
        <Link href="/" className="absolute left-6 top-8 flex items-center gap-2 lg:hidden">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-white text-[oklch(0.16_0.04_265)]">
            <Smile className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-semibold text-white">Dentify</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="w-full max-w-sm rounded-3xl border border-white/10 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.15)]"
        >
          <p className="text-lg font-semibold text-slate-950">Create your account</p>
          <p className="mt-1 text-sm text-slate-500">Set up patient portal access in a minute.</p>

          <form
            className="mt-6 space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              setSubmitting(true)
              // wire up to your auth endpoint here
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">First name</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">Last name</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Phone</label>
              <input
                type="tel"
                placeholder="+216 00 000 000"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Password</label>
              <input
                type="password"
                placeholder="At least 8 characters"
                required
                minLength={8}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400"
              />
            </div>

            <label className="flex items-start gap-2.5 pt-1 text-xs text-slate-500">
              <input type="checkbox" required className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 bg-slate-50" />
              I agree to the{" "}
              <Link href="/terms" className="text-slate-950 underline underline-offset-2">
                terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-slate-950 underline underline-offset-2">
                privacy policy
              </Link>
              .
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="group mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition-transform hover:scale-[1.02] disabled:opacity-60"
            >
              {submitting ? "Creating account…" : "Create account"}
              {!submitting && (
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-slate-950 underline underline-offset-2">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </main>
  )
}