import type { Metadata } from "next"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { ArrowUpRight, Activity, Microscope, Shield, Smile, Sparkles, Stethoscope } from "lucide-react"
import { LandingNavbar } from "@/app/(public)/landing/components/navbar"
import { LandingFooter } from "@/app/(public)/landing/components/footer"
import { BannerHero } from "@/app/(public)/landing/components/banner-hero"
import { CTASection } from "@/app/(public)/landing/components/cta"

export const metadata: Metadata = {
  title: "Our Services — Dentify",
  description: "Explore our comprehensive dental care services.",
}

interface Service {
  icon: LucideIcon
  title: string
  description: string
  image: string
  featured?: boolean
}

const services: Service[] = [
  {
    icon: Smile,
    title: "General Dentistry",
    description: "Routine exams, cleanings, and checkups to keep your teeth and gums in top shape all year for optimal oral health.",
    image: "/services/general-dentistry.jpg",
  },
  {
    icon: Sparkles,
    title: "Cosmetic Dentistry",
    description: "Enhance your smile with teeth whitening, veneers, and smile design treatments for brighter, confident, beautiful results.",
    image: "/services/cosmetic-dentistry.jpg",
    featured: true,
  },
  {
    icon: Activity,
    title: "Pediatric Dentistry",
    description: "Gentle, friendly dental care for kids — helping them build strong, lifelong oral health habits in a comfortable environment.",
    image: "/services/pediatric-dentistry.jpg",
  },
  {
    icon: Shield,
    title: "Restorative",
    description: "Expert dental care for all ages — helping you maintain a healthy, confident smile every single day with trusted treatments.",
    image: "/services/restorative.jpg",
  },
  {
    icon: Stethoscope,
    title: "Dental Implants",
    description: "Titanium-grade restorations placed with surgical-guide precision for lasting, natural-looking results.",
    image: "/services/implants.jpg",
    featured: true,
  },
  {
    icon: Smile,
    title: "Orthodontics",
    description: "Custom braces and clear aligners designed to straighten your smile with expert, gentle care.",
    image: "/services/orthodontics.jpg",
  },
  {
    icon: Microscope,
    title: "Microscopic Endo",
    description: "Root canal therapy under 25× magnification — quieter, faster healing with superior precision.",
    image: "/services/endo.jpg",
    featured: true,
  },
]

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <LandingNavbar />

      <main>
        <BannerHero
          eyebrow="Our Services"
          title={
            <>
              Comprehensive care for every smile
              <br />
              <span className="font-serif italic font-light text-sky-200">made personal.</span>
            </>
          }
          description="Explore our full range of personalized dental treatments, from preventative care to advanced restorative solutions, all delivered with comfort and confidence."
          primaryCta={{ href: "/booking", label: "Book an appointment" }}
          secondaryCta={{ href: "/about", label: "Learn about our practice" }}
        />

        <div className="mx-auto max-w-7xl px-6 py-24">
          {/* Section header — matches "THE TEAM" / "OUR PRACTICE" pattern */}
          <div className="mb-16 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">
                — Every treatment
              </p>
              <h2 className="mt-3 max-w-xl text-4xl font-light leading-tight tracking-tight sm:text-5xl">
                Every detail
                <br />
                <span className="font-serif italic font-light text-sky-600 dark:text-sky-300">
                  considered.
                </span>
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Seven specialties, one unhurried standard of care — from a first cleaning to advanced restorative work.
            </p>
          </div>

          {/* Services Grid */}
          <div className="space-y-6">
            {services.map((service, i) => {
              const IconComponent = service.icon
              const reverse = i % 2 === 1
              const cardBase = service.featured
                ? "relative bg-[#0a1224] text-white shadow-xl ring-1 ring-sky-400/20 hover:ring-sky-400/40"
                : "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200 hover:shadow-md dark:bg-slate-900 dark:text-white dark:ring-white/10"

              return (
                <Link
                  key={service.title}
                  href="/service-details"
                  className="group block"
                  aria-label={`Learn more about ${service.title}`}
                >
                  <div className={`overflow-hidden rounded-3xl transition duration-300 ${cardBase}`}>
                    {/* Glow treatment on featured cards, matching hero */}
                    {service.featured && (
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,_rgba(56,130,246,0.25),_transparent_45%)]" />
                    )}

                    <div className={`relative grid gap-6 p-8 sm:grid-cols-2 sm:items-center lg:p-10 ${reverse ? "sm:grid-flow-col-dense" : ""}`}>
                      <div className={`space-y-4 ${reverse ? "sm:col-start-2" : ""}`}>
                        <div className={`flex h-12 w-12 items-center justify-center rounded-lg text-2xl ${service.featured ? "bg-white/10 text-sky-300 ring-1 ring-white/15" : "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"}`}>
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <h3 className="text-3xl font-light leading-tight tracking-tight">
                          {service.title}
                        </h3>
                        <p className={`text-base leading-relaxed ${service.featured ? "text-slate-400" : "text-slate-600 dark:text-slate-300"}`}>
                          {service.description}
                        </p>
                        <div className={`inline-flex items-center gap-2 text-sm font-medium ${service.featured ? "text-sky-300" : "text-slate-700 dark:text-slate-300"}`}>
                          Learn more
                          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </div>
                      </div>

                      <div className={reverse ? "sm:col-start-1" : ""}>
                        <div className="overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
                          <img
                            src={service.image}
                            alt={service.title}
                            className="h-64 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        <CTASection
          title={
            <>
              Not sure where to start? <span className="italic text-background/80 dark:text-white/80">Let&apos;s talk it through.</span>
            </>
          }
          primaryCta={{ href: "/booking", label: "Book a visit" }}
          secondaryCta={{ href: "/about", label: "Meet the team" }}
        />
      </main>

      <LandingFooter />
    </div>
  )
}