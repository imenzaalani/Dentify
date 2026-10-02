"use client"

import { useEffect, useRef, useState } from "react"
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useMotionValueEvent,
} from "motion/react"
import { ArrowUpRight } from "lucide-react"
import { ease } from "./primitives"

function Tooth({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 260"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="toothBody" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
          <stop offset="55%" stopColor="#e8f4ff" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#3aa0ff" stopOpacity="0.78" />
        </linearGradient>
        <radialGradient id="toothHi" cx="0.3" cy="0.22" r="0.45">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="toothShade" cx="0.5" cy="1" r="0.7">
          <stop offset="0%" stopColor="#06283d" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#06283d" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path
        d="M110 14 C 58 14, 24 56, 32 118 C 36 150, 46 176, 56 208 C 64 232, 80 244, 90 222 C 97 206, 102 178, 110 178 C 118 178, 123 206, 130 222 C 140 244, 156 232, 164 208 C 174 176, 184 150, 188 118 C 196 56, 162 14, 110 14 Z"
        fill="url(#toothBody)"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1.2"
      />
      <path
        d="M110 14 C 58 14, 24 56, 32 118 C 36 150, 46 176, 56 208 C 64 232, 80 244, 90 222 C 97 206, 102 178, 110 178 C 118 178, 123 206, 130 222 C 140 244, 156 232, 164 208 C 174 176, 184 150, 188 118 C 196 56, 162 14, 110 14 Z"
        fill="url(#toothShade)"
      />
      <ellipse cx="78" cy="62" rx="22" ry="36" fill="url(#toothHi)" />
      <ellipse cx="142" cy="46" rx="6" ry="10" fill="#ffffff" opacity="0.6" />
    </svg>
  )
}

// function CursorFollower() {
//   const cursorX = useMotionValue(-100)
//   const cursorY = useMotionValue(-100)
//   const [isHovering, setIsHovering] = useState(false)

//   const springX = useSpring(cursorX, { stiffness: 500, damping: 40 })
//   const springY = useSpring(cursorY, { stiffness: 500, damping: 40 })

//   useEffect(() => {
//     const move = (e: MouseEvent) => {
//       cursorX.set(e.clientX)
//       cursorY.set(e.clientY)
//     }
//     const over = (e: MouseEvent) => {
//       const el = e.target as HTMLElement
//       setIsHovering(!!el.closest("a, button, [data-cursor-hover]"))
//     }
//     window.addEventListener("mousemove", move)
//     window.addEventListener("mouseover", over)
//     return () => {
//       window.removeEventListener("mousemove", move)
//       window.removeEventListener("mouseover", over)
//     }
//   }, [cursorX, cursorY])

//   return (
//     <>
//       <motion.div
//         className="pointer-events-none fixed z-[9999] hidden md:block"
//         style={{ x: springX, y: springY, translateX: "-50%", translateY: "-50%" }}
//       >
//         <motion.div
//           animate={{
//             width: isHovering ? 56 : 36,
//             height: isHovering ? 56 : 36,
//             borderColor: isHovering
//               ? "rgba(127,119,221,0.9)"
//               : "rgba(255,255,255,0.5)",
//             backgroundColor: isHovering
//               ? "rgba(127,119,221,0.15)"
//               : "transparent",
//           }}
//           transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
//           className="rounded-full border"
//         />
//       </motion.div>
//       <motion.div
//         className="pointer-events-none fixed z-[9999] hidden md:block"
//         style={{ x: cursorX, y: cursorY, translateX: "-50%", translateY: "-50%" }}
//       >
//         <motion.div
//           animate={{ scale: isHovering ? 0 : 1 }}
//           className="h-1.5 w-1.5 rounded-full bg-white"
//         />
//       </motion.div>
//     </>
//   )
// }

export function HeroSection() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })
  const yText = useTransform(scrollYProgress, [0, 1], [0, -80])
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0])

  const { scrollY } = useScroll()
  const [vh, setVh] = useState(900)
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    let width = window.innerWidth
    const onResize = () => {
      // Mobile browser chrome changes height while scrolling; only update for width changes.
      if (window.innerWidth === width) return
      width = window.innerWidth
      setVh(window.innerHeight)
    }
    const media = window.matchMedia("(max-width: 767px)")
    const updateMobile = () => setIsMobile(media.matches)
    setVh(window.innerHeight)
    updateMobile()
    window.addEventListener("resize", onResize)
    media.addEventListener("change", updateMobile)
    return () => {
      window.removeEventListener("resize", onResize)
      media.removeEventListener("change", updateMobile)
    }
  }, [])

  const toothScale = useTransform(scrollY, [0, vh * 1.4], [1, 5.5])
  const toothY = useTransform(scrollY, [0, vh * 1.4], [0, vh * 0.55])
  const toothRotate = useTransform(scrollY, [0, vh * 1.4], [0, -6])
  const toothOpacity = useTransform(scrollY, [vh * 0.8, vh * 1.5], [1, 0])

  const mpX = useMotionValue(0)
  const mpY = useMotionValue(0)
  const glowX = useTransform(mpX, (value) => value * 30)
  const glowY = useTransform(mpY, (value) => value * 30)
  const toothX = useTransform(mpX, (value) => value * -40)

  const [toothGone, setToothGone] = useState(false)
  useMotionValueEvent(toothOpacity, "change", (value) => {
    setToothGone(value <= 0.001)
  })

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)")
    if (!media.matches) return
    const on = (e: MouseEvent) => {
      mpX.set((e.clientX / window.innerWidth - 0.5) * 2)
      mpY.set((e.clientY / window.innerHeight - 0.5) * 2)
    }
    window.addEventListener("mousemove", on)
    return () => window.removeEventListener("mousemove", on)
  }, [mpX, mpY])

  return (
    <section
      id="top"
      ref={ref}
      className="relative z-10 flex min-h-[100svh] items-center justify-center overflow-hidden bg-[linear-gradient(135deg,oklch(0.16_0.04_265)_0%,oklch(0.22_0.08_240)_50%,oklch(0.18_0.06_260)_100%)] dark:bg-[linear-gradient(135deg,#0f5ebd_0%,#1683f0_45%,#5fb8ff_100%)]"
    >
      {/* Grid background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Side gradient shadows */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-[26%] bg-[radial-gradient(circle_at_left,rgba(0,0,0,0.22),transparent_55%)] dark:bg-[radial-gradient(circle_at_left,rgba(0,0,0,0.35),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-[26%] bg-[radial-gradient(circle_at_right,rgba(0,0,0,0.22),transparent_55%)] dark:bg-[radial-gradient(circle_at_right,rgba(0,0,0,0.35),transparent_55%)]"
      />

      {/* Mouse parallax glow */}
      <motion.div
        aria-hidden
        className="landing-hero-glow pointer-events-none absolute inset-0 overflow-hidden"
        style={{ x: glowX, y: glowY }}
      >
          <div className="absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,oklch(0.55_0.22_240/0.22),transparent_65%)]" />
      </motion.div>

      {/* Floating tooth */}
      <motion.div
        aria-hidden
        style={{
          y: isMobile ? 0 : toothY,
          scale: isMobile ? 1 : toothScale,
          rotate: isMobile ? 0 : toothRotate,
          opacity: toothOpacity,
          x: isMobile ? 0 : toothX,
          visibility: toothGone ? "hidden" : "visible",
        }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.8, ease, delay: 0.1 }}
        className="pointer-events-none fixed left-1/2 top-1/2 z-[5] -translate-x-1/2 -translate-y-1/2 will-change-transform"
      >
        <div className="landing-tooth-float relative" style={{ animation: "floatY 4s ease-in-out infinite", willChange: "transform" }}>
          <div className="landing-tooth-halo absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,oklch(0.6_0.22_240/0.35),transparent_70%)]" />
          <Tooth className="landing-tooth-svg relative h-[300px] w-[260px] sm:drop-shadow-[0_30px_80px_oklch(0.4_0.18_240/0.55)] sm:h-[420px] sm:w-[360px]" />
        </div>
      </motion.div>

      {/* Hero text */}
      <motion.div
        style={{ opacity, y: yText }}
        className="relative z-20 mx-auto max-w-5xl px-6 text-center mt-10 sm:mt-14"
      >
        <h1
          className="text-[clamp(3.5rem,12vw,11rem)] font-light leading-[0.92] tracking-[-0.05em] text-white"
          style={{ 
            fontFamily: "var(--font-geist-sans, system-ui)",
            textShadow: "0 2px 12px rgba(0,0,0,0.25), 0 6px 20px rgba(0,0,0,0.15)"
          }}
        >
          <span className=" block">
            <motion.span
              initial={{ y: "110%" }}
              animate={{ y: 0 }}
              transition={{ delay: 0.75, duration: 1, ease }}
              className="inline-block"
            >
              Smiles,
            </motion.span>
          </span>
          <span className="block">
            <motion.span
              initial={{ y: "110%" }}
              animate={{ y: 0 }}
              transition={{ delay: 0.95, duration: 1, ease }}
              className="inline-block font-display italic text-white"
            >
              redesigned.
            </motion.span>
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.35, duration: 0.9, ease }}
          className="mx-auto mt-10 max-w-md text-base leading-relaxed text-white/60 sm:text-lg"
        >
          A modern clinical dentistry experience for confident, deliberate smiles.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.6, duration: 0.7, ease }}
          className="mt-16 flex flex-wrap items-center justify-center gap-5 relative z-30 pointer-events-auto"
        >
          <a
            href="/booking"
            className="group relative z-40 inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-medium text-[oklch(0.16_0.04_265)] transition-transform hover:scale-[1.04] pointer-events-auto shadow-[0_0_40px_oklch(0.7_0.1_240/0.4)]"
          >
            Book an appointment
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
          <a
            href="#services"
            className="group relative z-40 inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white pointer-events-auto"
          >
            <span>Explore treatments</span>
            <span className="grid h-8 w-8 place-items-center rounded-full border border-white/20 transition-all group-hover:bg-white group-hover:text-foreground">
              →
            </span>
          </a>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.9, duration: 0.9, ease }}
        className="absolute bottom-10 left-0 right-0 z-20 mx-auto flex max-w-6xl items-end justify-between gap-6 px-6 text-white/55"
      >
        <div className="hidden sm:block">
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">
            Scroll
          </div>
          <div className="mt-3 h-10 w-px overflow-hidden bg-white/10">
            <motion.div
              className="h-4 w-px bg-white"
              animate={{ y: ["-100%", "200%"] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
            />
          </div>
        </div>
        <div className="w-0" />
      </motion.div>

      {/* Bottom fade */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background"
      />

      <style>{`
        @keyframes floatY {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-18px); }
        }
      `}</style>

      {/* <CursorFollower /> */}
    </section>
  )
}