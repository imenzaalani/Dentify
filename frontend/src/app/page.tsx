import type { Metadata } from 'next'
import HomePageClient from './home-page-client'

// Metadata for the landing page
export const metadata: Metadata = {
  title: 'Dentify',
  description: 'Dentify helps dental practices manage appointments, patients, and care with a modern experience.',
  keywords: ['dental clinic', 'patient management', 'appointments', 'dental software'],
  openGraph: {
    title: 'Dentify',
    description: 'Dentify helps dental practices manage appointments, patients, and care with a modern experience.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dentify',
    description: 'Dentify helps dental practices manage appointments, patients, and care with a modern experience.',
  },
}

export default function HomePage() {
  return <HomePageClient />
}
