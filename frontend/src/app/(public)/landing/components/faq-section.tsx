"use client"

import { HelpCircle, Plus } from "lucide-react"
import { motion } from "motion/react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Reveal } from "./primitives"

const FAQS = [
  {
    q: "Do you accept dental insurance?",
    a: "We work with most major PPO providers and will happily file claims on your behalf. For HMO and out-of-network plans, we provide itemised receipts you can submit for reimbursement.",
  },
  {
    q: "How long does a typical first visit take?",
    a: "Plan for about 60 minutes. This includes a digital intraoral scan, a calm consultation with one of our dentists, and a written treatment plan you take home.",
  },
  {
    q: "Are veneers reversible?",
    a: "Traditional porcelain veneers require minimal enamel reduction and are considered a permanent restoration. We also offer no-prep veneers in qualifying cases — fully reversible.",
  },
  {
    q: "Do you offer sedation for nervous patients?",
    a: "Yes. We offer nitrous oxide (laughing gas) for most appointments and oral sedation for longer procedures. Our entire studio is designed to keep anxiety low to begin with.",
  },
  {
    q: "What is your cancellation policy?",
    a: "We ask for 24 hours' notice for any change. Late cancellations within 24 hours are subject to a small fee, which we waive in the case of illness or emergencies.",
  },
  {
    q: "Can I bring my child for a first dental visit?",
    a: "Absolutely. We see patients from age three. First visits for children are short, friendly, and entirely sensory-led — no tools unless they're ready.",
  },
]

export function FaqSection() {
  return (
    <section id="faq" className="relative z-10 px-6 py-16 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        {/* Sticky left column */}
        <div className="lg:sticky lg:top-32">
          <Reveal>
            <div className="mb-3 text-xs uppercase tracking-[0.22em] text-primary">
              — FAQ
            </div>
            <h2 className="text-5xl font-light leading-[1] tracking-tight sm:text-6xl text-balance">
              Calm answers to the{" "}
              <span className="italic text-primary">honest questions.</span>
            </h2>
            <p className="mt-6 max-w-md text-muted-foreground dark:text-foreground/70">
              Anything we haven&apos;t covered? Reach out — we reply to every
              message personally.
            </p>
            <a
              href="#contact"
              className="group mt-8 inline-flex items-center gap-2 text-sm font-medium"
            >
              <HelpCircle className="h-4 w-4 text-primary" />
              <span className="underline underline-offset-4 decoration-primary/40 hover:decoration-primary transition-all">
                Ask us anything
              </span>
            </a>
          </Reveal>
        </div>

        {/* Accordion */}
        <Reveal delay={0.1}>
          <Accordion
            type="single"
            collapsible
            className="w-full"
            defaultValue="item-0"
          >
            {FAQS.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="group border-b border-border last:border-b-0"
              >
                <AccordionTrigger className="py-6 text-left font-medium text-xl tracking-tight hover:no-underline sm:text-2xl cursor-pointer [&>svg]:hidden">
                  <span className="flex w-full items-start justify-between gap-6">
                    <span className="text-balance">{f.q}</span>
                    <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border text-foreground transition-all group-data-[state=open]:rotate-45 group-data-[state=open]:border-primary group-data-[state=open]:bg-primary group-data-[state=open]:text-primary-foreground">
                      <Plus className="h-4 w-4" />
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-6 pr-14 text-base leading-relaxed text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  )
}