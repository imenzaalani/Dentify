import type { Metadata } from "next"
import { LandingNavbar } from "@/app/(public)/landing/components/navbar"
import { LandingFooter } from "@/app/(public)/landing/components/footer"
import { ArrowUpRight, Check } from "lucide-react"

export const metadata: Metadata = {
  title: "Service Details — Dentify",
  description: "Explore our dental services and specialized care.",
}

// Sample service data
const serviceData = {
  title: "Pediatric Dentistry",
  subtitle: "Gentle and specialized dental care for growing smiles with all.",
  image: "/services/pediatric.jpg",
  icon: "✓",
  aboutTitle: "About Service",
  aboutText: "Pediatric dentistry focuses on nurturing healthy and habits and providing specialized care for children from infancy through adolescence. A child's first dental experience plays a crucial role in shaping their attitudes toward oral health. That's why we prioritize a comfortable, friendly, and fun environment.\n\nEarly dental visits help identify any issues with tooth development. Catching problems early, such as early tooth decay, malocclusion, and guidance on proper brushing and flossing habits. We ensure children at higher risk of cavities receive extra attention and protective treatments.\n\nBeyond preventive care, we address common pediatric dental concerns, such as early tooth decay, teething discomfort, and management. Our team is trained to make dental visits positive and engaging, using child-friendly techniques and ensuring that kids sit comfortably during assessments.",
  buildingTitle: "Building a foundation for lifelong oral health",
  buildingText: "Teaching children the importance of oral hygiene from a young age creates habits that last a lifetime. By making dental visits positive and engaging, we help build a foundation for confident, healthy smiles.",
  features: [
    "Friendly dental rooms tailored for children",
    "Fluoride treatments to strengthen developing teeth",
    "Sealants for added cavity protection",
    "Gentle care for teething and early decay issues",
    "Guidance on lifelong and hygiene habits",
  ],
}

export default function ServiceDetailsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <LandingNavbar lightMode />

      <main className="pt-24">
        <div className="mx-auto max-w-6xl px-6 py-12">
          {/* Back link */}
          <a
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-sky-600 transition hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
          >
            <ArrowUpRight className="h-4 w-4 rotate-180" />
            Back to Home
          </a>

          {/* Header with icon */}
          <div className="mb-12 text-center">
            <div className="mb-6 inline-flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-600 text-xl font-bold text-white">
                ✓
              </div>
            </div>
            <h1 className="text-5xl font-bold leading-tight text-slate-950 dark:text-white sm:text-6xl">
              {serviceData.title}
            </h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
              {serviceData.subtitle}
            </p>
          </div>

          {/* Service Image */}
          <div className="mb-12 overflow-hidden rounded-3xl bg-slate-100 dark:bg-slate-900">
            <img
              src={serviceData.image}
              alt={serviceData.title}
              className="h-96 w-full object-cover"
            />
          </div>

          {/* About Service */}
          <div className="mb-16 space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-950 dark:text-white">
                {serviceData.aboutTitle}
              </h2>
              <div className="mt-6 space-y-4">
                {serviceData.aboutText.split("\n\n").map((paragraph, i) => (
                  <p key={i} className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Building Foundation Section */}
          <div className="rounded-2xl bg-slate-50 p-8 dark:bg-slate-900/50 sm:p-12">
            <h3 className="mb-6 text-2xl font-bold text-slate-950 dark:text-white">
              {serviceData.buildingTitle}
            </h3>
            <p className="mb-8 text-base leading-relaxed text-slate-600 dark:text-slate-300">
              {serviceData.buildingText}
            </p>

            {/* Features List */}
            <ul className="space-y-4">
              {serviceData.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-sky-600">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-base text-slate-700 dark:text-slate-200">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div className="mt-12 flex justify-center">
            <button className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-8 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600">
              <ArrowUpRight className="h-5 w-5" />
              Book an Appointment
            </button>
          </div>
        </div>
      </main>

      <div className="bg-gradient-to-b from-transparent to-slate-50 dark:to-slate-950 h-20" />
      <LandingFooter />
    </div>
  )
}
