"use client"

import { useRef, type ReactNode } from "react"
import { motion, useInView, useReducedMotion } from "motion/react"

export const ease = [0.22, 1, 0.36, 1] as const

export const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease },
  },
}

export function Reveal({
  children,
  delay = 0,
  y = 40,
  className = "",
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })
  const shouldReduceMotion = useReducedMotion()
  return (
    <motion.div
      ref={ref}
      initial={shouldReduceMotion ? false : { opacity: 0, y: Math.min(y, 24) }}
      animate={shouldReduceMotion || inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: shouldReduceMotion ? 0 : 0.6, ease, delay: shouldReduceMotion ? 0 : delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function Stagger({
  children,
  className = "",
  delay = 0.06,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  const shouldReduceMotion = useReducedMotion()
  return (
    <motion.div
      ref={ref}
      initial={shouldReduceMotion ? false : "hidden"}
      animate={shouldReduceMotion || inView ? "show" : "hidden"}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: delay, delayChildren: 0.1 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}