"use client"

import { motion } from "motion/react"
import { Heart, Microscope, Leaf, Award } from "lucide-react"
import { Reveal, Stagger, itemVariants } from "./primitives"

const VALUES = [
  { icon: Heart, title: "Human first", desc: "Every visit starts with a conversation. Treatment plans are written for people, not procedures." },
  { icon: Microscope, title: "Precision craft", desc: "From digital scans to hand-finished ceramics, we work at the millimeter — never the minute." },
  { icon: Leaf, title: "Quiet space", desc: "Soft architecture, warm light, and instruments hidden until needed. A clinic that feels nothing like one." },
  { icon: Award, title: "Lasting work", desc: "We use materials with 12+ year warranties because we expect to see you smile for decades." },
]

export function ValuesSection() {
  return (
    <section className="relative z-10 px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 max-w-3xl">
          <Reveal>
            <div className="mb-3 text-xs uppercase tracking-[0.22em] text-primary">— What we believe</div>
            <h2 className="text-5xl font-light leading-[1] tracking-tight sm:text-6xl text-balance">
              Four quiet principles, applied <span className="italic gradient-text">obsessively.</span>
            </h2>
          </Reveal>
        </div>
        <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {VALUES.map((v) => (
            <motion.article
              key={v.title}
              variants={itemVariants}
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="group relative overflow-hidden rounded-3xl border border-border bg-card p-8 transition-shadow hover:shadow-[0_30px_80px_-30px_oklch(0.16_0.04_265/0.25)] dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/20 dark:hover:bg-white/[0.05] dark:hover:shadow-[0_30px_80px_-30px_rgba(56,130,246,0.35)] sm:p-10"
            >
              {/* Dark-mode-only glow that appears on hover, anchored behind the icon */}
              <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-sky-400/0 blur-[60px] max-md:hidden transition-colors duration-500 group-hover:bg-sky-400/20 dark:block hidden" />

              <div className="relative mb-10 grid h-12 w-12 place-items-center rounded-2xl bg-mist text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground dark:bg-white/[0.06] dark:text-sky-300 dark:ring-1 dark:ring-white/10 dark:group-hover:bg-sky-400 dark:group-hover:text-[#0a1224] dark:group-hover:ring-sky-400/40">
                <v.icon className="h-5 w-5" strokeWidth={1.6} />
              </div>
              <h3 className="relative font-display text-2xl">{v.title}</h3>
              <p className="relative mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
            </motion.article>
          ))}
        </Stagger>
      </div>
    </section>
  )
}