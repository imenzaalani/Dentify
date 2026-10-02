"use client"

import { LandingNavbar } from "@/app/(public)/landing/components/navbar"
import { HeroSection } from "@/app/(public)/landing/components/hero-section"
import { LogoCarousel } from "@/app/(public)/landing/components/logo-carousel"
import { ServicesSection } from "@/app/(public)/landing/components/services-section"
import { TeamSection } from "@/app/(public)/landing/components/team-section"
import { TestimonialsSection } from "@/app/(public)/landing/components/testimonials-section"
import { FaqSection } from "@/app/(public)/landing/components/faq-section"
import { ContactSection } from "@/app/(public)/landing/components/contact-section"
import { LandingFooter } from "@/app/(public)/landing/components/footer"
import { ClinicSection } from "@/app/(public)/landing/components/clinic-section"
import { ResultsSection } from "@/app/(public)/landing/components/results-section"
import { BackToTop } from "@/app/(public)/landing/components/back-to-top"

export function LandingPageContent() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <LandingNavbar />
      <main>
        <HeroSection />
        <LogoCarousel />
        <ServicesSection />
        <ClinicSection />
        <TeamSection />
        <ResultsSection />
        <TestimonialsSection />
        <FaqSection />
        <ContactSection />
      </main>
      <div className="bg-gradient-to-b from-transparent to-slate-50 dark:to-slate-950 h-20" />
      <LandingFooter />
      <BackToTop />
    </div>
  )
}