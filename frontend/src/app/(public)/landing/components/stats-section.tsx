"use client"

import { motion } from "motion/react"
import { Reveal, Stagger, itemVariants } from "./primitives"

const stats = [
  { number: "150+", label: "Patients served" },
  { number: "+10", label: "Years in business" },
  { number: "500+", label: "Smile transformations" },
  { number: "98%", label: "Patient satisfaction" },
  { number: "260", label: "Procedures monthly" },
  { number: "20+", label: "Expert specialists" },
]

export function StatsSection() {
  return (
    <section className="relative z-10 px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:gap-8">
          <Stagger className="contents" delay={0.08}>
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                className="flex flex-col gap-2"
              >
                <div className="text-4xl font-bold text-foreground sm:text-5xl">
                  {stat.number}
                </div>
                <p className="text-sm text-muted-foreground dark:text-foreground/70">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  )
}
