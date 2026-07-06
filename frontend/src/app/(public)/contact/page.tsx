import type { Metadata } from "next"
import { LandingNavbar } from "@/app/(public)/landing/components/navbar"
import { LandingFooter } from "@/app/(public)/landing/components/footer"
import { BannerHero } from "@/app/(public)/landing/components/banner-hero"
import { ContactSection } from "@/app/(public)/landing/components/contact-section"

export const metadata: Metadata = {
  title: "Contact — Dentify",
  description: "Get in touch with Dentify for appointments and inquiries.",
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <LandingNavbar />

      <main>
        <BannerHero
          eyebrow="Contact"
          title={
            <>
              We&apos;re here to help you
              <br />
              <span className="font-serif italic font-light text-sky-200">smile with confidence.</span>
            </>
          }
          description="Reach out for appointments, questions, or to learn more about our dental care services."
          primaryCta={{ href: "/booking", label: "Book an appointment" }}
          secondaryCta={{ href: "/services", label: "Explore treatments" }}
        />

        <ContactSection showForm />
      </main>

      <LandingFooter />
    </div>
  )
}