import type { Metadata } from "next"
import { LandingNavbar } from "@/app/(public)/landing/components/navbar"
import { LandingFooter } from "@/app/(public)/landing/components/footer"
import { TeamSection } from "@/app/(public)/landing/components/team-section"
import { ContactSection } from "@/app/(public)/landing/components/contact-section"
import ConcernsSection from "@/app/(public)/landing/components/concerns-section"
import { BannerHero } from "@/app/(public)/landing/components/banner-hero"

export const metadata: Metadata = {
  title: "Doctors — Dentify",
  description: "Meet the dentists and specialists behind Dentify.",
}

export default function DoctorsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <LandingNavbar />

      <main>
        <BannerHero
          eyebrow="Meet our team"
          title={
            <>
              Professionals committed to
              <br />
              <span className="font-serif italic font-light text-sky-200">exceptional care</span>
            </>
          }
          description="Every doctor on our team combines specialized training with calm, patient-focused care — so every appointment feels confident and comfortable."
          primaryCta={{ href: "/booking", label: "Book a consultation" }}
          secondaryCta={{ href: "/about", label: "Learn our story" }}
        />

        <TeamSection showLink={false} showHeader={true} />
        <ConcernsSection />
        <ContactSection />
      </main>

      <LandingFooter />
    </div>
  )
}