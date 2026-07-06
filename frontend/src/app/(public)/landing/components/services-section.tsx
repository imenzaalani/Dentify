"use client"

import Link from "next/link"
import { motion } from "motion/react"
import {
  Smile,
  Stethoscope,
  Activity,
  Sparkles,
  Microscope,
  Shield,
  ArrowUpRight,
  ArrowRight,
} from "lucide-react"
import { Reveal, Stagger, itemVariants } from "./primitives"

const services = [
  {
    icon: Smile,
    title: "General Dentistry",
    desc: "Routine exams, cleanings, and checkups to keep your teeth and gums in top shape all year for optimal oral health.",
  },
  {
    icon: Sparkles,
    title: "Cosmetic Dentistry",
    desc: "Enhance your smile with teeth whitening, veneers, and smile design treatments for brighter, confident, beautiful results.",
  },
  {
    icon: Activity,
    title: "Pediatric Dentistry",
    desc: "Gentle, friendly dental care for kids — helping them build strong, lifelong oral health habits in a comfortable environment.",
  },
  {
    icon: Shield,
    title: "Restorative",
    desc: "Expert dental care for all ages — helping you maintain a healthy, confident smile every single day with trusted treatments.",
  },
  {
    icon: Stethoscope,
    title: "Dental Implants",
    desc: "Titanium-grade restorations placed with surgical-guide precision for lasting, natural-looking results.",
  },
  {
    icon: Smile,
    title: "Orthodontics",
    desc: "Custom braces and clear aligners designed to straighten your smile with expert, gentle care.",
  },
]

export function ServicesSection() {
  return (
    <section id="services" className="relative z-10 px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex-1">
            <Reveal>
              <div className="mb-3 text-xs uppercase tracking-[0.22em] text-primary">
                — Treatments
              </div>
              <h2 className="max-w-2xl text-5xl font-light leading-[1] tracking-tight sm:text-6xl text-balance">
                Every detail considered.{" "}
                <span className="italic gradient-text">Every smile, deliberate.</span>
              </h2>
            </Reveal>
          </div>

          <div className="flex items-center gap-4">
            <Reveal delay={0.15}>
              <p className="max-w-sm text-muted-foreground dark:text-foreground/70">
                A complete studio — from preventive checkups to full smile
                reconstructions — under one calm, modern roof.
              </p>
            </Reveal>

            <Reveal delay={0.2}>
              <Link
                href="/services"
                className="group ml-auto inline-flex items-center gap-1.5 rounded-full px-4 py-3 text-sm font-medium bg-primary text-primary-foreground transition-transform hover:scale-[1.03]"
              >
                See all services
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Reveal>
          </div>
        </div>

        <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <Link key={s.title} href="/service-details">
              <motion.article
                variants={itemVariants}
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="group relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-[0_4px_24px_-8px_oklch(0.16_0.04_265/0.12)] transition-all hover:shadow-[0_30px_80px_-30px_oklch(0.16_0.04_265/0.25)] dark:border-white/15 dark:bg-[oklch(0.16_0.05_220)] dark:hover:shadow-[0_30px_80px_-30px_oklch(0.62_0.28_215/0.3)] cursor-pointer"
              >
                <div className="absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-gradient-to-br from-primary/5 to-transparent" />
                <div className="mb-12 flex items-center justify-between">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-muted text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <s.icon className="h-5 w-5" strokeWidth={1.6} />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="text-2xl font-semibold">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {s.desc}
                </p>
                <div className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                  Learn more
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </div>
              </motion.article>
            </Link>
          ))}
        </Stagger>
      </div>
    </section>
  )
}
