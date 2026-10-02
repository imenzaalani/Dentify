"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "motion/react"
import { ArrowUpRight, Check, Eye, EyeOff, KeyRound, Smile } from "lucide-react"
import { ease } from "@/app/(public)/landing/components/primitives"
import { ModeToggle } from "@/components/mode-toggle"
import { AuthBackground } from "../components/auth-background"
import { Logo } from "@/components/logo"
import { PasswordStrengthMeter } from "@/components/ui/password-strength-meter"
import { authApi, ApiError } from "@/lib/api"
import { useTranslation } from "@/hooks/use-translation"

const RESET_REDIRECT_SECONDS = 3

function PasswordField({
  label,
  name,
  value,
  onChange,
  autoComplete,
  autoFocus,
  error,
}: {
  label: string
  name: string
  value: string
  onChange: (v: string) => void
  autoComplete: string
  autoFocus?: boolean
  error?: string
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">{label}</label>
      <div className="relative">
        <input
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          required
          className={`w-full rounded-xl border bg-slate-50 px-4 py-2.5 pr-10 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 ${
            error
              ? "border-red-300 focus:border-red-400 dark:border-red-500/40 dark:focus:border-red-500/60"
              : "border-slate-200 focus:border-slate-400 dark:border-white/10 dark:focus:border-white/30"
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300"
          tabIndex={-1}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}

export default function ResetPasswordPage() {
  const { t } = useTranslation("auth")
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmPassword?: string }>({})
  const [done, setDone] = useState(false)
  const [redirectIn, setRedirectIn] = useState(RESET_REDIRECT_SECONDS)

  useEffect(() => {
    if (!done) return
    if (redirectIn <= 0) {
      router.push("/sign-in")
      return
    }
    const t = setTimeout(() => setRedirectIn((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [done, redirectIn, router])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!token) return
    setError(null)

    const errors: { password?: string; confirmPassword?: string } = {}
    if (password.length < 8) errors.password = t("passwordMinLength")
    if (password !== confirmPassword) errors.confirmPassword = t("passwordsDontMatch")
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSubmitting(true)
    try {
      await authApi.resetPassword(token, password)
      setDone(true)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : t("linkInvalidReset")
      )
    } finally {
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
        </Link>

        <div className="relative max-w-sm">
          <p className="font-serif text-3xl italic text-white/90">
            {t("resetHeroHeadline")}
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/60">
            {[
              t("resetHeroFeature1"),
              t("resetHeroFeature2"),
              t("resetHeroFeature3"),
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
            <Smile className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-semibold text-white">Dentify</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="w-full max-w-sm rounded-3xl border border-white/10 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.15)] dark:border-white/10 dark:bg-slate-900 dark:shadow-[0_8px_30px_rgb(0,0,0,0.45)]"
        >
          <div className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-900 dark:bg-white/10 dark:text-white">
            <KeyRound className="h-5 w-5" />
          </div>

          {!token ? (
            <>
              <p className="text-center text-lg font-semibold text-slate-950 dark:text-white">{t("missingResetToken")}</p>
              <p className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">
                {t("missingResetTokenDetail")}
              </p>
              <Link
                href="/forgot-password"
                className="group mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition-transform hover:scale-[1.02] dark:bg-white dark:text-slate-950"
              >
                {t("requestNewLink")}
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </>
          ) : done ? (
            <>
              <p className="text-center text-lg font-semibold text-slate-950 dark:text-white">{t("passwordUpdated")}</p>
              <p className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">
                {t("redirectingIn", { count: redirectIn })}
              </p>
              <Link
                href="/sign-in"
                className="group mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition-transform hover:scale-[1.02] dark:bg-white dark:text-slate-950"
              >
                {t("goToSignInNow")}
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </>
          ) : (
            <>
              <p className="text-center text-lg font-semibold text-slate-950 dark:text-white">{t("resetYourPassword")}</p>
              <p className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">
                {t("resetPasswordSubtitle")}
              </p>

              <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
                {error && (
                  <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-500/10 dark:text-red-400">
                    <p>{error}</p>
                    <Link href="/forgot-password" className="mt-1 inline-block font-medium underline underline-offset-2">
                      {t("requestNewResetLink")}
                    </Link>
                  </div>
                )}

                <PasswordField
                  label={t("newPassword")}
                  name="password"
                  value={password}
                  onChange={setPassword}
                  autoComplete="new-password"
                  autoFocus
                  error={fieldErrors.password}
                />
                {password && <PasswordStrengthMeter password={password} />}
                <PasswordField
                  label={t("confirmPassword")}
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  autoComplete="new-password"
                  error={fieldErrors.confirmPassword}
                />

                <button
                  type="submit"
                  disabled={submitting}
                  className="group mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition-transform hover:scale-[1.02] disabled:opacity-60 dark:bg-white dark:text-slate-950"
                >
                  {submitting ? t("updating") : t("updatePassword")}
                  {!submitting && (
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  )}
                </button>
              </form>
            </>
          )}

          <p className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
            {t("rememberedIt")}{" "}
            <Link href="/sign-in" className="text-slate-950 underline underline-offset-2 dark:text-white">
              {t("backToSignIn")}
            </Link>
            .
          </p>
        </motion.div>
      </div>
    </main>
  )
}
