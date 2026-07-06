import type { Metadata } from "next"
import Link from "next/link"
import { LandingNavbar } from "@/app/(public)/landing/components/navbar"
import { LandingFooter } from "@/app/(public)/landing/components/footer"
import { ArrowUpRight, Mail, Phone, MapPin } from "lucide-react"

export const metadata: Metadata = {
  title: "Doctor Profile — Dentify",
  description: "Meet our dental specialist.",
}

// Sample doctor data - replace with dynamic data from params if needed
const doctorData = {
  name: "Dr. Carter",
  credentials: "DDS, MSc (Orthodontics)",
  specialty: "Orthodontics",
  image: "/doctors/doctor-1.jpg",
  bio: "Dr. Thompson is a highly skilled orthodontist with over 15 years of experience, dedicated to creating beautiful, confident smiles. He combines advanced orthodontic techniques with a personalized approach to ensure every patient receives tailored care. Passionate about comfort and long-term results, Dr. Thompson works with both children and adults, helping them achieve functional, aesthetically pleasing, and lasting smiles that enhance overall oral health and lifelong self-confidence benefits.",
  email: "dr.carter@perfectsmile.com",
  phone: "+1 (555) 123-4567",
}

// Other doctors for carousel
const otherDoctors = [
  { img: "/doctors/doctor-2.jpg", name: "Dr. James Parker", role: "Lead Cosmetic Dentist", email: "james@perfectsmile.com", phone: "+1 (555) 123-4568" },
  { img: "/doctors/doctor-3.jpg", name: "Dr. Oliver Thompson", role: "Senior Implantologist", email: "oliver@perfectsmile.com", phone: "+1 (555) 123-4569" },
  { img: "/doctors/doctor-1.jpg", name: "Dr. Ethan Collins", role: "Pediatric Dentist", email: "ethan@perfectsmile.com", phone: "+1 (555) 123-4570" },
  { img: "/doctors/doctor-2.jpg", name: "Dr. Samuel Ahmed", role: "Root Canal Specialist", email: "samuel@perfectsmile.com", phone: "+1 (555) 123-4571" },
]

export default function DentistDetailsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <LandingNavbar lightMode />

      <main className="pt-24">
        <div className="mx-auto max-w-6xl px-6 py-12">
          {/* Back link */}
          <a
            href="/#doctors"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-sky-600 transition hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
          >
            <ArrowUpRight className="h-4 w-4 rotate-180" />
            Back to Doctors List
          </a>

          <div className="grid gap-12 lg:grid-cols-[1fr_1.5fr]">
            {/* Left: Image */}
            <div className="flex items-start">
              <div className="w-full overflow-hidden rounded-3xl bg-slate-100 dark:bg-slate-900">
                <img
                  src={doctorData.image}
                  alt={doctorData.name}
                  className="aspect-[3/4] w-full object-cover"
                />
              </div>
            </div>

            {/* Right: Content */}
            <div className="space-y-8">
              {/* Header */}
              <div>
                <h1 className="text-5xl font-bold leading-tight text-slate-950 dark:text-white sm:text-6xl">
                  {doctorData.name}
                </h1>
                <p className="mt-2 text-lg text-slate-500 dark:text-slate-400">
                  {doctorData.credentials}
                </p>
              </div>

              {/* Bio */}
              <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
                {doctorData.bio}
              </p>

              {/* CTA Button */}
              <div>
                <button className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600">
                  <ArrowUpRight className="h-5 w-5" />
                  Book an Appointment
                </button>
              </div>

              {/* Divider */}
              <div className="h-px bg-slate-200 dark:bg-slate-800" />

              {/* Contact Section */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
                  Contact
                </h2>

                <div className="space-y-5">
                  {/* Email */}
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/30">
                      <Mail className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Email
                      </div>
                      <a
                        href={`mailto:${doctorData.email}`}
                        className="text-base text-slate-950 transition hover:text-sky-600 dark:text-white dark:hover:text-sky-400"
                      >
                        {doctorData.email}
                      </a>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/30">
                      <Phone className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Phone
                      </div>
                      <a
                        href={`tel:${doctorData.phone}`}
                        className="text-base text-slate-950 transition hover:text-sky-600 dark:text-white dark:hover:text-sky-400"
                      >
                        {doctorData.phone}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Other Doctors Carousel Section */}
        <section className="border-t border-slate-200 bg-slate-50 py-16 dark:border-slate-800 dark:bg-slate-900/50 sm:py-24">
          <div className="mx-auto max-w-7xl px-6">
            {/* Header */}
            <div className="mb-12 flex items-center justify-between gap-6">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Our Doctors</p>
                <h2 className="mt-2 text-4xl font-bold text-slate-950 dark:text-white sm:text-5xl">
                  Meet Our Other Specialists
                </h2>
                <p className="mt-4 max-w-2xl text-base text-slate-600 dark:text-slate-300">
                  A dedicated team of professionals with one goal — your healthiest, happiest smile.
                </p>
              </div>
              <Link
                href="/#doctors"
                className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 whitespace-nowrap"
              >
                <ArrowUpRight className="h-5 w-5" />
                All doctors
              </Link>
            </div>

            {/* Carousel */}
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-6">
                {otherDoctors.map((doctor, i) => (
                  <div
                    key={i}
                    className="group min-w-[280px] flex-shrink-0 overflow-hidden rounded-2xl bg-white shadow-lg transition hover:shadow-xl dark:bg-slate-950 dark:shadow-lg"
                  >
                    <Link href="/dentist-details" className="block overflow-hidden">
                      <div className="relative overflow-hidden bg-slate-100 dark:bg-slate-900">
                        <img
                          src={doctor.img}
                          alt={doctor.name}
                          className="h-64 w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="space-y-3 p-5 pb-0">
                        <div>
                          <h3 className="font-semibold text-slate-950 dark:text-white">
                            {doctor.name}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {doctor.role}
                          </p>
                        </div>
                      </div>
                    </Link>
                    <div className="flex items-center justify-between border-t border-slate-100 p-5 pt-4 dark:border-slate-800">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        View profile
                      </span>
                      <div className="flex items-center gap-2">
                        <a
                          href={`mailto:${doctor.email}`}
                          className="rounded-lg bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                          title={`Email ${doctor.name}`}
                        >
                          <Mail className="h-4 w-4" />
                        </a>
                        <a
                          href={`tel:${doctor.phone}`}
                          className="rounded-lg bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                          title={`Call ${doctor.name}`}
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="bg-gradient-to-b from-transparent to-slate-50 dark:to-slate-950 h-20" />
      <LandingFooter />
    </div>
  )
}
