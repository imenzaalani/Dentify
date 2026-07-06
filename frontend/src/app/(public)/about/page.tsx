import type { Metadata } from "next"
import { LandingNavbar } from "@/app/(public)/landing/components/navbar"
import { LandingFooter } from "@/app/(public)/landing/components/footer"
import { BannerHero } from "@/app/(public)/landing/components/banner-hero"
import { FeaturesSection } from "@/app/(public)/landing/components/features-section"
import { ValuesSection } from "@/app/(public)/landing/components/values-section"
import { TeamSection } from "@/app/(public)/landing/components/team-section"
import { ContactSection } from "@/app/(public)/landing/components/contact-section"
import { CTASection } from "@/app/(public)/landing/components/cta"
import { TimelineSection } from "@/app/(public)/landing/components/timeline-section"

export const metadata: Metadata = {
  title: "About us — Dentify",
  description: "Learn about Dentify, our mission, and our team of expert dental professionals.",
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <LandingNavbar />

      <main>
        <BannerHero
          eyebrow="About us"
          title={
            <>
              A modern dental care home
              <br />
              <span className="font-serif italic font-light text-sky-200">for families.</span>
            </>
          }
          description="We&apos;re committed to providing exceptional dental care that makes you smile. With our team of experienced specialists and state-of-the-art technology, we deliver results you can trust."
          primaryCta={{ href: "/booking", label: "Book an appointment" }}
          secondaryCta={{ href: "/services", label: "Explore treatments" }}
        />
        <FeaturesSection />
        <TimelineSection/>
        <ValuesSection />
        <TeamSection showLink={true} showHeader={true} />
        <ContactSection />
        <CTASection/>
      </main>

      <LandingFooter />
    </div>
  )
}
