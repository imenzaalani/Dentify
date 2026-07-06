"use client"

import { Reveal } from "./primitives"
import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

const smileDetailImage = "/smile-detail.jpg"
const clinicImage = "/clinic.jpg"

export function FeaturesSection() {
  return (
    <section className="relative z-10 px-6 py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <Reveal>
          <div className="mb-3 text-xs uppercase tracking-[0.22em] text-primary">— Our practice</div>
          <h2 className="text-5xl font-light leading-[1] tracking-tight sm:text-6xl text-balance">
            Modern dentistry, <span className="italic gradient-text">slowed down.</span>
          </h2>
          <p className="mt-6 max-w-lg text-muted-foreground">
            Dentify began with a stubborn belief: that the most advanced clinical work and the calmest patient
            experience aren't opposites — they reinforce each other. Eighteen years later, the studio is still small
            on purpose. Six specialists. One philosophy. No conveyor-belt dentistry.
          </p>
          <p className="mt-4 max-w-lg text-muted-foreground">
            Every plan is written by hand. Every veneer is glazed in our own lab. Every patient leaves with the dentist's
            direct line, because the work doesn't end at the chair.
          </p>
          <Link
            href="/contact"
            className="group mt-10 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-transform hover:scale-[1.03]"
          >
            Visit the studio
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem]">
              <Image
                src={clinicImage}
                alt="Dentify studio interior"
                fill
                className="object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent" />
            </div>
            <div className="absolute -bottom-8 -left-6 hidden w-56 rotate-[-4deg] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-border sm:block">
              <div className="relative aspect-[4/3]">
                <Image
                  src={smileDetailImage}
                  alt="Hand-finished veneer detail"
                  fill
                  className="object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
