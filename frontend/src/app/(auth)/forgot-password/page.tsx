"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { ArrowUpRight, Check, Mail, Smile } from "lucide-react"
import { ease } from "@/app/(public)/landing/components/primitives"
import { ModeToggle } from "@/components/mode-toggle"
import { AuthBackground } from "../components/auth-background"
import { Logo } from "@/components/logo"
import { authApi, ApiError } from "@/lib/api"
import { useTranslation } from "@/hooks/use-translation"

const RESEND_COOLDOWN_SECONDS = 60

function maskEmail(email: string): string {
  const [local, domain] = email.split("@")
  if (!local || !domain) return email
  if (local.length <= 2) return `${local[0] ?? ""}***@${domain}`
  return `${local[0]}${"*".repeat(Math.min(local.length - 2, 4))}${local[local.length - 1]}@${domain}`
}

export default function ForgotPasswordPage() {
  const { t } = useTranslation("auth")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState("")
  const [cooldown, setCooldown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN_SECONDS)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  async function submitRequest(email: string) {
    setError(null)
    setSubmitting(true)
    try {
      await authApi.forgotPassword(email, "patient")
      setSent(true)
      setSentEmail(email)
      startCooldown()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.")
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
            {t("forgotHeroHeadline")}
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/60">
            {[
              t("forgotHeroFeature1"),
              t("forgotHeroFeature2"),
              t("forgotHeroFeature3"),
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
            <Mail className="h-5 w-5" />
          </div>

          {sent ? (
            <>
              <p className="text-center text-lg font-semibold text-slate-950 dark:text-white">{t("checkYourInbox")}</p>

              <div className="mt-4 rounded-lg bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                <p className="font-medium">{t("resetLinkSent")}</p>
                <p className="mt-0.5">
                  {t("resetLinkSentDetail", { email: maskEmail(sentEmail) })}
                </p>
              </div>

              <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
                {t("resendPrompt")}{" "}
                {cooldown > 0 ? (
                  <span>{t("resendIn", { count: cooldown })}</span>
                ) : (
                  <button
                    type="button"
                    className="text-slate-950 underline underline-offset-2 dark:text-white"
                    onClick={() => submitRequest(sentEmail)}
                    disabled={submitting}
                  >
                    {submitting ? t("sending") : t("sendItAgain")}
                  </button>
                )}
              </p>
            </>
          ) : (
            <>
              <p className="text-center text-lg font-semibold text-slate-950 dark:text-white">{t("forgotYourPassword")}</p>
              <p className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">
                {t("forgotPasswordSubtitle")}
              </p>

              <form
                className="mt-6 space-y-3"
                onSubmit={async (e) => {
                  e.preventDefault()
                  const form = new FormData(e.currentTarget)
                  const email = String(form.get("email") ?? "")
                  await submitRequest(email)
                }}
              >
                {error && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-500/10 dark:text-red-400">
                    {error}
                  </p>
                )}

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">{t("email")}</label>
                  <input
                    name="email"
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    autoFocus
                    autoComplete="email"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-white/30"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="group mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition-transform hover:scale-[1.02] disabled:opacity-60 dark:bg-white dark:text-slate-950"
                >
                  {submitting ? t("sendingLink") : t("sendResetLink")}
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
          </p>
        </motion.div>
      </div>
    </main>
  )
}
