"use client"

// app/booking/page.tsx
//
// Booking flow modeled on the NexHealth pattern you shared:
//   1) Select appointment type (simple list, not cards)
//   2) Select a date and time (multi-day grid + map sidebar)
//   3) Patient/contact details + review, with an appointment-summary sidebar
// Same design system as the rest of the app (oklch tokens, lucide icons,
// motion), same navbar/footer shell, brand color instead of their teal.
import { useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "motion/react"
import {
  ArrowLeft,
  ArrowUpRight,
  ChevronRight,
  ChevronLeft,
  Check,
  Calendar as CalendarIcon,
  CircleHelp,
  MapPin,
  Phone,
  User,
  Users,
  UserCircle,
} from "lucide-react"
import { format, addDays, isBefore, startOfDay } from "date-fns"
import { ModeToggle } from "@/components/mode-toggle"
import { AuthBackground } from "@/app/(auth)/components/auth-background"
import {Logo} from "@/components/logo"

// ── Practice info — edit these to match your real practice ────────────────
const PRACTICE = {
  name: "Dentify Dental Studio",
  address: "123 Main Street, Suite 4, Your City",
  phone: "(555) 123-4567",
}

const APPOINTMENT_TYPES = [
  { id: "checkup", label: "General Checkup" },
  { id: "cosmetic", label: "Cosmetic Consultation" },
  { id: "veneers", label: "Veneers Consultation" },
  { id: "implants", label: "Dental Implant Consultation" },
  { id: "invisalign", label: "Invisalign Consultation" },
  { id: "whitening", label: "Whitening Consultation" },
  { id: "existing-cleaning", label: "Existing Patient — Cleaning and Exam" },
  { id: "new-cleaning", label: "New Patient — Cleaning and Exam" },
] as const

const TIME_SLOTS = ["09:00", "09:45", "10:30", "11:15", "12:00", "14:00", "14:45", "15:30", "17:00"] as const

const HEAR_ABOUT_OPTIONS = ["Google", "Instagram/Facebook", "Yelp", "Family/Friend", "Walk by", "Other"] as const

type BookingFor = "myself" | "dependent" | "other"

type PatientInfo = {
  firstName: string
  lastName: string
  legalSex: string
  dob: string
  zip: string
  email: string
  phone: string
  consent: boolean
  comments: string
  hearAbout: string | null
  hearAboutOther: string
}

const EMPTY_PATIENT: PatientInfo = {
  firstName: "",
  lastName: "",
  legalSex: "",
  dob: "",
  zip: "",
  email: "",
  phone: "",
  consent: true,
  comments: "",
  hearAbout: null,
  hearAboutOther: "",
}

// ── Small building blocks ───────────────────────────────────────────────

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-900 dark:text-white">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        maxLength={120}
        className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm text-slate-950 dark:text-white outline-none transition focus:border-primary placeholder:text-slate-400 dark:placeholder:text-white/30"
      />
    </div>
  )
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-900 dark:text-white">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm text-slate-950 dark:text-white outline-none transition focus:border-primary"
      >
        <option value="">Select</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  )
}

// Appointment summary card shown on steps 2 & 3
function AppointmentSummary({
  service,
  date,
  slot,
}: {
  service: string | undefined
  date: Date | null
  slot: string | null
}) {
  return (
    <div className="space-y-5 rounded-[1.6rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_70px_-30px_oklch(0.16_0.04_265/0.35)] backdrop-blur text-slate-950 dark:border-white/10 dark:bg-slate-950/90 dark:text-white">
      <div className="text-base font-semibold text-slate-950 dark:text-white">Appointment details</div>

      <div className="flex items-start gap-3">
        <CalendarIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500 dark:text-white/50" />
        <div className="text-sm">
          <div className="font-medium text-slate-900 dark:text-white">{service ?? "Select a treatment"}</div>
          {date && (
            <div className="text-slate-600 dark:text-white/60">
              {format(date, "EEEE, MMMM d, yyyy")}
              {slot ? ` at ${slot}` : ""}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-start gap-3">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-500 dark:text-white/50" />
        <div className="text-sm">
          <div className="font-medium text-slate-900 dark:text-white">{PRACTICE.name}</div>
          <div className="text-slate-600 dark:text-white/60">{PRACTICE.address}</div>
          <div className="text-slate-600 dark:text-white/60">{PRACTICE.phone}</div>
        </div>
      </div>
    </div>
  )
}

function StepProgress({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { number: 1, label: "Service" },
    { number: 2, label: "Date & time" },
    { number: 3, label: "Details" },
  ] as const

  return (
    <div className="flex items-center justify-center gap-4">
      {steps.map((item) => {
        const isActive = item.number === step
        const isComplete = item.number < step

        return (
          <div key={item.number} className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition ${
                isComplete
                  ? "bg-primary text-primary-foreground"
                  : isActive
                    ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                    : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/60"
              }`}
            >
              {item.number}
            </div>
            <span className={`text-xs font-medium ${isActive ? "text-slate-950 dark:text-white" : "text-slate-500 dark:text-white/60"}`}>
              {item.label}
            </span>
            {item.number < steps.length && (
              <div className="hidden h-px w-16 bg-slate-200 dark:bg-white/10 sm:block" />
            )}
          </div>
        )
      })}
    </div>
  )
}

function SectionCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[1.6rem] border border-slate-200/80 bg-white/85 p-6 shadow-[0_20px_70px_-35px_oklch(0.16_0.04_265/0.35)] backdrop-blur text-slate-950 dark:border-white/10 dark:bg-slate-950/90 dark:text-white ${className}`}>
      {children}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────

export default function BookingPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [service, setService] = useState<string | null>(null)
  const [dayOffset, setDayOffset] = useState(0)
  const [date, setDate] = useState<Date | null>(null)
  const [slot, setSlot] = useState<string | null>(null)
  const [bookingFor, setBookingFor] = useState<BookingFor>("myself")
  const [patient, setPatient] = useState<PatientInfo>(EMPTY_PATIENT)
  const [sent, setSent] = useState(false)

  const today = startOfDay(new Date())
  const selectedType = APPOINTMENT_TYPES.find((t) => t.id === service)

  const visibleDates = useMemo(() => {
    const dates: Date[] = []
    let cursor = addDays(today, dayOffset)
    while (dates.length < 5) {
      if (cursor.getDay() !== 0 && !isBefore(cursor, today)) dates.push(cursor)
      cursor = addDays(cursor, 1)
    }
    return dates
  }, [today, dayOffset])

  const slotsForDate = (d: Date) => {
    const seed = d.getDate()
    const count = 2 + (seed % 4)
    const rotated = [...TIME_SLOTS.slice(seed % TIME_SLOTS.length), ...TIME_SLOTS.slice(0, seed % TIME_SLOTS.length)]
    return rotated.slice(0, count)
  }

  const goNext = () => setStep((s) => (s < 3 ? ((s + 1) as 1 | 2 | 3) : s))
  const goBack = () => {
    if (step === 1) return
    setStep((s) => (s - 1) as 1 | 2 | 3)
  }

  const patientComplete =
    patient.firstName.trim().length > 1 &&
    patient.lastName.trim().length > 1 &&
    patient.dob.length > 0 &&
    /^\S+@\S+\.\S+$/.test(patient.email) &&
    patient.phone.trim().length > 5

  const onConfirm = () => {
    // TODO: call your backend API to create the appointment
    // POST /api/appointments { service, bookingFor, date, slot, ...patient }
    setSent(true)
  }

  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(PRACTICE.address)}&output=embed`

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,oklch(0.16_0.04_265)_0%,oklch(0.22_0.08_240)_50%,oklch(0.18_0.06_260)_100%)] text-slate-950 transition-colors dark:bg-[linear-gradient(135deg,#0f5ebd_0%,#1683f0_45%,#5fb8ff_100%)] dark:text-white">
      <div className="pointer-events-none absolute inset-0">
        <AuthBackground />
      </div>

      <div className="relative z-10">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-[linear-gradient(90deg,oklch(0.986_0.008_248/0.88),oklch(0.95_0.025_240/0.84))] px-6 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-[linear-gradient(90deg,oklch(0.11_0.035_235/0.88),oklch(0.16_0.045_225/0.86))]">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight text-slate-950 dark:text-white">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-white text-[oklch(0.16_0.04_265)]">
                        <Logo className="h-4 w-4" strokeWidth={2.5} />
                      </div>
            <span>{PRACTICE.name}</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/contact"
              className="hidden h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white/90 px-3 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-950 dark:border-white/15 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/20 dark:hover:text-white sm:flex"
            >
              <CircleHelp className="h-3.5 w-3.5" />
              <span>Need help</span>
            </Link>
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="px-6 pb-24 pt-6 lg:pt-8">
        <div className="mx-auto max-w-6xl">
          {!sent && (
            <button
              type="button"
              onClick={() => (step === 1 ? window.history.back() : goBack())}
              className="mb-8 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-400 dark:text-slate-100 dark:hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
          )}

          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mx-auto flex max-w-lg flex-col items-center gap-5 rounded-[2rem] border border-slate-200/80 bg-white/85 px-8 py-16 text-center shadow-[0_30px_90px_-40px_oklch(0.16_0.04_265/0.35)] backdrop-blur dark:border-white/10 dark:bg-white/[0.04]"
              >
                <div className="grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-6 w-6" />
                </div>
                <div className="text-3xl font-semibold text-slate-950 dark:text-white">Appointment requested</div>
                <p className="max-w-md text-sm text-slate-700 dark:text-white/70">
                  We&apos;ve received your request for{" "}
                  <span className="font-medium text-slate-950 dark:text-white">{selectedType?.label}</span> on{" "}
                  <span className="font-medium text-slate-950 dark:text-white">{date && format(date, "EEE, MMM d")}</span> at{" "}
                  <span className="font-medium text-slate-950 dark:text-white">{slot}</span>. A confirmation will arrive at{" "}
                  <span className="font-medium text-slate-950 dark:text-white">{patient.email}</span>.
                </p>
                <Link
                  href="/"
                  className="mt-1 inline-flex items-center gap-1.5 text-sm text-slate-600 transition hover:text-slate-900 dark:text-white/60 dark:hover:text-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to home
                </Link>
              </motion.div>
            ) : step === 1 ? (
              // ── Step 1: appointment type list ─────────────────────────
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="mx-auto max-w-4xl"
              >
                <SectionCard className="p-8 sm:p-10">
                  <div className="mb-8 text-center">
                    <div className="mb-3 inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-slate-600 dark:border-white/10 dark:bg-slate-950/70 dark:text-slate-200">
                      Welcome to {PRACTICE.name}
                    </div>
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                      Choose the visit that fits you best
                    </h1>
                    <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 dark:text-white/60">
                      Select the care you need and we’ll guide you through the rest of the booking flow.
                    </p>
                  </div>

                  <div className="mb-8 flex justify-center">
                    <StepProgress step={1} />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {APPOINTMENT_TYPES.map((t) => (
                      <motion.button
                        key={t.id}
                        type="button"
                        whileHover={{ y: -1, scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => {
                          setService(t.id)
                          goNext()
                        }}
                        className="flex w-full items-center justify-between rounded-[1.25rem] border border-slate-200/80 bg-white/80 px-5 py-4 text-left transition hover:border-slate-400 hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-white/30 dark:hover:bg-slate-900/60"
                      >
                        <span className="font-semibold text-slate-950 dark:text-white">{t.label}</span>
                        <ChevronRight className="h-4 w-4 text-slate-400 dark:text-white/40" />
                      </motion.button>
                    ))}
                  </div>
                </SectionCard>
              </motion.div>
            ) : step === 2 ? (
              // ── Step 2: date and time ─────────────────────────────────
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]"
              >
                <SectionCard className="p-6 sm:p-8">
                  <div className="mb-6">
                    <StepProgress step={2} />
                  </div>
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Select a date and time</h1>
                  <p className="mt-1 text-sm text-slate-600 dark:text-white/60">{selectedType?.label}</p>

                  <div className="mt-6 flex items-center justify-between rounded-[1.25rem] border border-slate-200/80 bg-slate-50/80 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      {format(visibleDates[0], "MMMM yyyy")}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setDayOffset((d) => Math.max(0, d - 5))}
                        disabled={dayOffset === 0}
                        className="grid h-7 w-7 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 disabled:opacity-30 dark:text-white/50 dark:hover:bg-white/10"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDayOffset((d) => d + 5)}
                        className="grid h-7 w-7 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 dark:text-white/50 dark:hover:bg-white/10"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {visibleDates.map((d) => (
                      <div key={d.toISOString()} className="flex flex-col items-center gap-3 rounded-[1.1rem] border border-slate-200/70 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                        <div className="text-center">
                          <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-white/50">
                            {format(d, "EEE")}
                          </div>
                          <div className="text-lg font-semibold text-slate-950 dark:text-white">{format(d, "d")}</div>
                        </div>
                        <div className="flex w-full flex-col gap-2">
                          {slotsForDate(d).map((t) => {
                            const isSelected = date?.getTime() === d.getTime() && slot === t
                            return (
                              <button
                                key={t}
                                type="button"
                                onClick={() => {
                                  setDate(d)
                                  setSlot(t)
                                  goNext()
                                }}
                                className={`rounded-lg border px-1.5 py-2 text-xs font-medium transition-colors ${
                                  isSelected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-slate-200 text-slate-700 hover:border-primary hover:text-primary dark:border-white/15 dark:text-white/70"
                                }`}
                              >
                                {t}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <div className="space-y-6">
                  <AppointmentSummary service={selectedType?.label} date={date} slot={slot} />
                  <div className="overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-white/85 shadow-[0_20px_70px_-35px_oklch(0.16_0.04_265/0.35)] backdrop-blur dark:border-white/10 dark:bg-white/[0.04]">
                    <iframe
                      title="Practice location"
                      src={mapSrc}
                      width="100%"
                      height="220"
                      style={{ border: 0 }}
                      loading="lazy"
                    />
                  </div>
                </div>
              </motion.div>
            ) : (
              // ── Step 3: who + details + review ────────────────────────
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]"
              >
                <div className="space-y-6">
                  <SectionCard className="p-6 sm:p-8">
                    <div className="mb-6">
                      <StepProgress step={3} />
                    </div>
                    <h2 className="mb-4 text-lg font-semibold text-slate-950 dark:text-white">
                      Who are you booking for?
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {(
                        [
                          { id: "myself", label: "Myself", icon: User },
                          { id: "dependent", label: "Child or dependent", icon: Users },
                          { id: "other", label: "Someone else", icon: UserCircle },
                        ] as const
                      ).map((o) => (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => setBookingFor(o.id)}
                          className={`flex flex-col items-center gap-2 rounded-[1.2rem] border px-3 py-5 text-center transition-colors ${
                            bookingFor === o.id
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-slate-200 text-slate-600 hover:border-slate-400 dark:border-white/10 dark:text-white/60"
                          }`}
                        >
                          <o.icon className="h-5 w-5" />
                          <span className="text-sm font-medium">{o.label}</span>
                        </button>
                      ))}
                    </div>
                  </SectionCard>

                  <SectionCard className="p-6 sm:p-8">
                    <h2 className="mb-1 text-lg font-semibold text-slate-950 dark:text-white">Patient details</h2>
                    <p className="mb-4 text-sm text-slate-600 dark:text-white/60">
                      Please provide the following information about the person receiving care.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        id="firstName"
                        label="First name"
                        value={patient.firstName}
                        onChange={(v) => setPatient({ ...patient, firstName: v })}
                      />
                      <Field
                        id="lastName"
                        label="Last name"
                        value={patient.lastName}
                        onChange={(v) => setPatient({ ...patient, lastName: v })}
                      />
                      <SelectField
                        id="legalSex"
                        label="Legal sex"
                        value={patient.legalSex}
                        onChange={(v) => setPatient({ ...patient, legalSex: v })}
                        options={["Male", "Female", "Other"]}
                      />
                      <Field
                        id="dob"
                        label="Date of birth"
                        type="date"
                        value={patient.dob}
                        onChange={(v) => setPatient({ ...patient, dob: v })}
                      />
                      <div className="sm:col-span-2">
                        <Field
                          id="zip"
                          label="Zip/postal code"
                          value={patient.zip}
                          onChange={(v) => setPatient({ ...patient, zip: v })}
                        />
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard className="p-6 sm:p-8">
                    <h2 className="mb-4 text-lg font-semibold text-slate-950 dark:text-white">Contact details</h2>
                    <div className="space-y-4">
                      <Field
                        id="email"
                        label="Email"
                        type="email"
                        value={patient.email}
                        onChange={(v) => setPatient({ ...patient, email: v })}
                      />
                      <Field
                        id="phone"
                        label="Phone number"
                        type="tel"
                        value={patient.phone}
                        onChange={(v) => setPatient({ ...patient, phone: v })}
                      />
                      <label className="flex items-start gap-2 text-xs text-slate-500 dark:text-white/50">
                        <input
                          type="checkbox"
                          checked={patient.consent}
                          onChange={(e) => setPatient({ ...patient, consent: e.target.checked })}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        By leaving checked, I agree to receive appointment-related calls and texts.
                      </label>
                    </div>
                  </SectionCard>

                  <SectionCard className="p-6 sm:p-8">
                    <h2 className="mb-4 text-lg font-semibold text-slate-950 dark:text-white">Other details</h2>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="comments" className="mb-1.5 block text-sm font-medium text-slate-900 dark:text-white">
                          Comments or special request{" "}
                          <span className="font-normal text-slate-400 dark:text-white/40">(optional)</span>
                        </label>
                        <textarea
                          id="comments"
                          rows={2}
                          value={patient.comments}
                          onChange={(e) => setPatient({ ...patient, comments: e.target.value })}
                          maxLength={500}
                          className="w-full resize-none rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm text-slate-950 dark:text-white outline-none transition focus:border-primary"
                        />
                      </div>

                      <div>
                        <div className="mb-2 text-sm font-medium text-slate-900 dark:text-white">
                          How did you hear about our practice?
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {HEAR_ABOUT_OPTIONS.map((o) => (
                            <button
                              key={o}
                              type="button"
                              onClick={() => setPatient({ ...patient, hearAbout: o })}
                              className={`rounded-full border px-4 py-1.5 text-xs transition-colors ${
                                patient.hearAbout === o
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-slate-300 text-slate-700 hover:border-slate-400 dark:border-white/15 dark:text-white/70"
                              }`}
                            >
                              {o}
                            </button>
                          ))}
                        </div>
                        <AnimatePresence>
                          {patient.hearAbout === "Other" && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="pt-3">
                                <Field
                                  id="hearAboutOther"
                                  label="Describe other"
                                  value={patient.hearAboutOther}
                                  onChange={(v) => setPatient({ ...patient, hearAboutOther: v })}
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard className="p-6 sm:p-8">
                    <p className="mb-4 text-xs text-slate-500 dark:text-white/50">
                      By clicking &quot;Book appointment,&quot; you agree to our Terms and Privacy Policy.
                    </p>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onConfirm}
                      disabled={!patientComplete}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-slate-950/10 transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-50"
                    >
                      Book appointment
                      <ArrowUpRight className="h-4 w-4" />
                    </motion.button>
                  </SectionCard>
                </div>

                <div className="lg:sticky lg:top-32 lg:self-start">
                  <AppointmentSummary service={selectedType?.label} date={date} slot={slot} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* <footer className="border-t border-slate-200 px-6 py-10 text-center dark:border-white/10">
        <div className="mx-auto max-w-5xl space-y-1 text-sm text-slate-500 dark:text-white/50">
          <div className="font-medium text-slate-900 dark:text-white">{PRACTICE.name}</div>
          <div>{PRACTICE.address}</div>
          <div>{PRACTICE.phone}</div>
        </div>
      </footer> */}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Notes:
// - PRACTICE constant at the top controls the name/address/phone shown in
//   the summary card and the Google Maps embed — update it to your real info.
// - The map embed uses the no-API-key `?output=embed` query param, so it
//   works immediately, but for production Google recommends an API-key
//   embed (more reliable, no usage cap surprises).
// - slotsForDate() generates fake varied time slots per day for now —
//   replace with a real availability fetch from your backend/PMS.
// - Want a page title? This file can't export `metadata` (client component).
//   Add `useEffect(() => { document.title = "..." }, [])` or split into a
//   server wrapper page.tsx + this as a client child component.
// ─────────────────────────────────────────────────────────────────────────