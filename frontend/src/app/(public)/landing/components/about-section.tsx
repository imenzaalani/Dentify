"use client"

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CardDecorator } from '@/components/ui/card-decorator'
import { Github, Code, Palette, Layout, Crown } from 'lucide-react'

const values = [
  {
    icon: Code,
    title: 'Patient First',
    description: 'Every workflow is designed around the patient experience, making care simple, calm, and efficient.'
  },
  {
    icon: Palette,
    title: 'Clinical Excellence',
    description: 'We maintain the highest standards of care, combining modern technology with thoughtful clinical workflows.'
  },
  {
    icon: Layout,
    title: 'Production Ready',
    description: 'Battle-tested components used in real applications with proven performance and reliability across different environments.'
  },
  {
    icon: Crown,
    title: 'Premium Quality',
    description: 'Hand-crafted with attention to detail and performance optimization, ensuring exceptional user experience and accessibility.'
  }
]

export function AboutSection() {
  return (
    <section id="about" className="py-24 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-4xl text-center mb-16">
          <Badge variant="outline" className="mb-4">
            About Dentify
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
            Built for modern dentistry, by care-driven teams
          </h2>
          <p className="text-lg text-muted-foreground dark:text-foreground/70 mb-8">
            We&apos;re passionate about creating a modern platform for clinical dentistry.
            Our mission is to simplify patient journeys and help clinics deliver care with clarity and confidence.
          </p>
        </div>

        {/* Modern Values Grid with Enhanced Design */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-4 mb-12">
          {values.map((value, index) => (
            <Card key={index} className='group shadow-xs py-2'>
              <CardContent className='p-8'>
                <div className='flex flex-col items-center text-center'>
                  <CardDecorator>
                    <value.icon className='h-6 w-6' aria-hidden />
                  </CardDecorator>
                  <h3 className='mt-6 font-medium text-balance'>{value.title}</h3>
                  <p className='text-muted-foreground mt-3 text-sm'>{value.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-muted-foreground">❤️ Built with care for every patient and provider</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="cursor-pointer" asChild>
              <a href="/booking" target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 h-4 w-4" />
                Book a consultation
              </a>
            </Button>
            <Button size="lg" variant="outline" className="cursor-pointer" asChild>
              <a href="/contact" target="_blank" rel="noopener noreferrer">
                Contact the clinic
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
