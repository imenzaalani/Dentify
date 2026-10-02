"use client"

import { motion } from "motion/react"
import { Quote } from "lucide-react"
import { Reveal, Stagger, itemVariants } from "./primitives"
import { useIsMobile } from "./use-is-mobile"

const list = [
  {
    q: "I genuinely forgot I was at the dentist. The veneers look like they were always mine.",
    n: "Elena R.",
    role: "Teacher",
  },
  {
    q: "Quiet, considered, and remarkably gentle. The team explained every step before touching me.",
    n: "Marcus T.",
    role: "Architect",
  },
  {
    q: "Six months of Invisalign and a result I'd given up on in my twenties.",
    n: "Priya N.",
    role: "Designer",
  },
  {
    q: "The studio feels like a Scandinavian hotel. The work feels like Swiss engineering.",
    n: "Jonas L.",
    role: "Engineer",
  },
  {
    q: "Every visit felt calm and considered. I've never trusted a dentist this much.",
    n: "Sara M.",
    role: "Photographer",
  },
  {
    q: "The digital smile preview meant I knew exactly what to expect. Zero surprises.",
    n: "Kenji A.",
    role: "Developer",
  },
]

const rotations = [-3, 1.5, -2, 2.5, -1.5, 3]
const offsets = [0, 40, 20, 60, 10, 50]

export function TestimonialsSection() {
  const isMobile = useIsMobile()
  return (
    <section className="relative z-10 overflow-hidden px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="mb-16 flex flex-col items-center text-center">
            <div className="mb-3 text-xs uppercase tracking-[0.22em] text-primary">
              — Testimonials
            </div>
            <h2 className="max-w-2xl text-5xl font-light leading-[1] tracking-tight sm:text-6xl text-balance">
              Our patients share their stories.
            </h2>
            <p className="mt-4 max-w-md text-muted-foreground dark:text-foreground/70">
              Real experiences from happy patients who trust us with their
              smiles.
            </p>
          </div>
        </Reveal>

        <Stagger
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          delay={0.08}
        >
          {list.map((item, i) => (
            <motion.figure
              key={i}
              variants={itemVariants}
              whileHover={
                isMobile
                  ? undefined
                  : {
                      rotate: 0,
                      y: -8,
                      scale: 1.02,
                      zIndex: 10,
                      transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
                    }
              }
              style={{
                rotate: rotations[i],
                marginTop: offsets[i],
              }}
              className="relative rounded-3xl border bg-card p-7 shadow-[0_4px_24px_-8px_oklch(0.16_0.04_265/0.12)] transition-all dark:border-white/15 dark:bg-[oklch(0.16_0.05_220)] hover:shadow-[0_20px_60px_-20px_oklch(0.16_0.04_265/0.25)] dark:hover:shadow-[0_20px_60px_-20px_oklch(0.62_0.28_215/0.3)] border-border"
            >
              {/* Top row */}
              <div className="mb-5 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-lg font-semibold text-primary">
                  {item.n.charAt(0)}
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-full border border-border bg-muted dark:border-white/10 dark:bg-white/5">
                  <Quote className="h-4 w-4 text-muted-foreground/60 dark:text-white/40" />
                </div>
              </div>

              {/* Name + role */}
              <div className="mb-4">
                <div className="text-xl font-semibold">{item.n}</div>
                <div className="text-sm text-muted-foreground">{item.role}</div>
              </div>

              {/* Quote */}
              <blockquote className="text-sm leading-relaxed text-muted-foreground dark:text-white/70">
                &ldquo;{item.q}&rdquo;
              </blockquote>
            </motion.figure>
          ))}
        </Stagger>
      </div>
    </section>
  )
}