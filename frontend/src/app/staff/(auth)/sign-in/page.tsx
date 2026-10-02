"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "motion/react"
import { ArrowUpRight, Briefcase, Check, Eye, EyeOff } from "lucide-react"
import { ease } from "@/app/(public)/landing/components/primitives"
import { ModeToggle } from "@/components/mode-toggle"
import { AuthBackground } from "../components/auth-background"
import { Logo } from "@/components/logo"
import { useAuth } from "@/lib/auth"
import { ApiError } from "@/lib/api"

export default function StaffSignInPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [wrongPortal, setWrongPortal] = useState(false)
  const [isDisabled, setIsDisabled] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setWrongPortal(false)
    setIsDisabled(false)
    setSubmitting(true)

    const form = new FormData(e.currentTarget)
    const email = String(form.get("email") ?? "")
    const password = String(form.get("password") ?? "")

    try {
      // portal: "staff" — the backend rejects non-staff accounts here with
      // a clear 403, so there's no need to re-check the role client-side.
      await login(email, password, "staff", rememberMe)
      router.push("/staff/dashboard")
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
        // A 403 here can mean two different things — "credentials were
        // correct, but this is a patient account" (portal mismatch) or
        // "credentials were correct, but this account has been disabled".
        // Only the first one should point the person at the patient
        // sign-in page.
        setWrongPortal(err.status === 403 && err.message.includes("isn't registered for the"))
        setIsDisabled(err.status === 403 && err.message === "Account is disabled")
      } else {
        setError("Something went wrong. Please try again.")
      }
      setSubmitting(false)
    }
  }

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
          <span className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/70">
            Staff
          </span>
        </Link>

        <div className="relative max-w-sm">
          <p className="font-serif text-3xl italic text-white/90">
            Everything you need to run the day, in one place.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/60">
            {[
              "Full schedule and patient records",
              "Treatment plans and care coordination",
              "Team messaging and daily tasks",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-white/10">
                  <Check className="h-2.5 w-2.5 text-white/70" strokeWidth={3} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/40">© {new Date().getFullYear()} Dentify Dental Studio</p>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-6 py-16">
        <Link href="/" className="absolute left-6 top-8 flex items-center gap-2 lg:hidden">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-white text-[oklch(0.16_0.04_265)]">
            <Briefcase className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-semibold text-white">Dentify Staff</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="w-full max-w-sm rounded-3xl border border-white/10 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.15)] dark:border-white/10 dark:bg-slate-900 dark:shadow-[0_8px_30px_rgb(0,0,0,0.45)]"
        >
          <p className="text-lg font-semibold text-slate-950 dark:text-white">Staff sign in</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Access your Dentify dashboard.</p>

          <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-500/10 dark:text-red-400">
                {error}
                {wrongPortal && (
                  <>
                    {" "}
                    <Link href="/sign-in" className="inline-flex items-center gap-0.5 font-medium underline underline-offset-2">
                      Go to patient portal
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </>
                )}
                {isDisabled && (
                  <span className="mt-0.5 block text-red-500/90 dark:text-red-400/80">
                    Your account has been disabled. Contact your practice owner to have it restored.
                  </span>
                )}
              </p>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">Email</label>
              <input
                name="email"
                type="email"
                placeholder="you@dentify.com"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-white/30"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Password</label>
                <Link
                  href="/staff/forgot-password"
                  className="text-xs text-slate-400 underline underline-offset-2 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-10 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-white/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300 accent-slate-950 dark:border-white/20 dark:accent-white"
              />
              Stay signed in on this device
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="group mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition-transform hover:scale-[1.02] disabled:opacity-60 dark:bg-white dark:text-slate-950"
            >
              {submitting ? "Signing in…" : "Sign in"}
              {!submitting && (
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
            Not a staff member?{" "}
            <Link href="/sign-in" className="text-slate-950 underline underline-offset-2 dark:text-white">
              Go to the patient portal
            </Link>
            .
          </p>
        </motion.div>
      </div>
    </main>
  )
}