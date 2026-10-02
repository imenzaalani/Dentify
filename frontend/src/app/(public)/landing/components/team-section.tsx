"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, } from "motion/react"
import { ArrowUpRight, ArrowRight } from "lucide-react"
import { Reveal, Stagger, itemVariants } from "./primitives"

// Replace these with your actual image paths in /public/
// e.g. /public/doctors/doctor-1.jpg
const doc1 = "/doctors/doctor-1.jpg"
const doc2 = "/doctors/doctor-2.jpg"
const doc3 = "/doctors/doctor-3.jpg"

const team = [
  { img: doc1, name: "Dr. Adrian Vale", role: "Implantology · Founder", years: "18 yrs" },
  { img: doc2, name: "Dr. Mira Kavanagh", role: "Cosmetic & Veneers", years: "12 yrs" },
  { img: doc3, name: "Dr. Theo Lindholm", role: "Orthodontics", years: "9 yrs" },
  { img: doc1, name: "Dr. Sana Okafor", role: "Endodontics", years: "14 yrs" },
  { img: doc2, name: "Dr. Iris Lemaire", role: "Pediatric Dentistry", years: "7 yrs" },
  { img: doc3, name: "Dr. Kenji Aalto", role: "Prosthodontics", years: "11 yrs" },
]

function DoctorCard({
  doc,
  index,
}: {
  doc: (typeof team)[0]
  index: number
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link href="/dentist-details">
      <motion.article
        variants={itemVariants}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        className="group cursor-pointer overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-950"
      >
        <div className="relative overflow-hidden bg-slate-100 dark:bg-slate-900">
          <motion.img
            src={doc.img}
            alt={doc.name}
            className="h-72 w-full object-cover object-top transition duration-700 sm:h-80"
            animate={{ scale: hovered ? 1.05 : 1.0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
        </div>

        <div className="space-y-3 p-5 text-left sm:space-y-4 sm:p-6">
          <div className="flex items-center justify-between gap-2 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 sm:tracking-[0.24em]">
            <span className="whitespace-nowrap">Doctor {index + 1}</span>
            <span className="shrink-0 whitespace-nowrap rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold normal-case tracking-normal text-slate-700 dark:border-slate-700 dark:text-slate-300">
              {doc.years}
            </span>
          </div>

          <div>
            <div className="text-xl font-semibold text-slate-950 sm:text-2xl dark:text-white">
              {doc.name}
            </div>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {doc.role}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 text-sm font-medium text-sky-600 transition group-hover:text-sky-700 dark:text-sky-300 dark:group-hover:text-sky-200">
            <span>View profile</span>
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>
      </motion.article>
    </Link>
  )
}

export function TeamSection({ showLink = true, showHeader = true }: { showLink?: boolean; showHeader?: boolean }) {
  return (
    <section id="doctors" className="relative z-10 px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl">
        {showHeader && (
          <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex-1">

              <Reveal>
                <div className="mb-3 text-xs uppercase tracking-[0.22em] text-primary">
                  — The Team
                </div>
                <h2 className="max-w-3xl text-5xl font-light leading-[1] tracking-tight sm:text-6xl text-balance">
                  Quiet expertise.{" "}
                  <span className="italic gradient-text">Decades, distilled.</span>
                </h2>
              </Reveal>
            </div>
            <div className="flex items-center gap-4">
              <Reveal delay={0.15}>
                <p className="max-w-sm text-muted-foreground dark:text-foreground/70">
                  Six specialists, one shared standard <br />— unhurried and
                  entirely focused on you.
                </p>
              </Reveal>
              {showLink ? (
                <Reveal delay={0.2}>
                  <Link
                    href="/doctors"
                    className="group ml-auto inline-flex items-center gap-1.5 rounded-full px-4 py-3 text-sm font-medium bg-primary text-primary-foreground transition-transform hover:scale-[1.03]"
                  >
                    See all doctors
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Reveal>
              ) : null}
            </div>
          </div>
        )}

        <Stagger
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3"
          delay={0.07}
        >
          {team.map((doc, i) => (
            <DoctorCard key={doc.name} doc={doc} index={i} />
          ))}
        </Stagger>
      </div>
    </section>
  )
}