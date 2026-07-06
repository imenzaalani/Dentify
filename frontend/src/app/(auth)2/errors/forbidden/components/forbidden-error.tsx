"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Image from "next/image"

export function ForbiddenError() {
  const router = useRouter()

  return (
    <div className='mx-auto flex min-h-dvh flex-col items-center justify-center gap-8 p-8 md:gap-12 md:p-16'>
      <Image
        src='https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=960&q=80'
        alt='Dentify clinic access illustration'
        width={960}
        height={540}
        className='aspect-video w-240 rounded-xl object-cover dark:brightness-[0.95] dark:invert'
      />
      <div className='text-center'>
        <h1 className='mb-4 text-3xl font-bold'>403</h1>
        <h2 className="mb-3 text-2xl font-semibold">Access restricted</h2>
        <p>Your account doesn&apos;t currently have permission to view this Dentify clinical area. Please contact the clinic team or return to the main portal.</p>
        <div className='mt-6 flex items-center justify-center gap-4 md:mt-8'>
          <Button className='cursor-pointer' onClick={() => router.push('/dashboard')}>Go Back Home</Button>
          <Button variant='outline' className='flex cursor-pointer items-center gap-1' onClick={() => router.push('#')}>
            Contact Us
          </Button>
        </div>
      </div>
    </div>
  )
}
