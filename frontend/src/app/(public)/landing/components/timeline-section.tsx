"use client"

import { motion } from "motion/react"
import { Reveal, Stagger, itemVariants } from "./primitives"

const TIMELINE = [
    { year: "2007", t: "Founded by Dr. Adrian Vale in a one-chair studio above a Mercer Street bookshop." },
    { year: "2012", t: "Moved to our current four-floor home and opened the in-house ceramic lab." },
    { year: "2016", t: "Awarded Invisalign Diamond Provider for the third consecutive year." },
    { year: "2021", t: "Introduced full Digital Smile Design and 3Shape TRIOS workflows." },
    { year: "2025", t: "12,000 smiles crafted. Six specialists. One quietly obsessed studio." },
];


export function TimelineSection() {
    return (
        <section className="relative z-10 px-6 py-24 sm:py-32">
            <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[0.85fr_1.15fr]">
                <Reveal>
                    <div className="lg:sticky lg:top-32">
                        <div className="mb-3 text-xs uppercase tracking-[0.22em] text-primary">— Our story</div>
                        <h2 className="text-5xl font-light leading-[1] tracking-tight sm:text-6xl text-balance">
                            Eighteen years, <span className="italic gradient-text">six chairs.</span>
                        </h2>
                        <p className="mt-6 max-w-sm text-muted-foreground">
                            Growth, when it happened, was always in the direction of more care — never more volume.
                        </p>
                    </div>
                </Reveal>

                <Stagger className="space-y-2">
                    {TIMELINE.map((m) => (
                        <motion.div
                            key={m.year}
                            variants={itemVariants}
                            className="grid grid-cols-[auto_1fr] items-baseline gap-6 border-t border-border py-7"
                        >
                            <div className="font-grotesk text-3xl tracking-tight text-primary sm:text-4xl">{m.year}</div>
                            <p className="text-base leading-relaxed text-foreground sm:text-lg text-balance">{m.t}</p>
                        </motion.div>
                    ))}
                </Stagger>
            </div>
        </section>
    )
}