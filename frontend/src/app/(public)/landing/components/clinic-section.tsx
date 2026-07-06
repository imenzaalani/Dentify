import { useRef } from "react"
import { motion, useScroll, useTransform } from "motion/react"
import { Reveal } from "./primitives"

const clinicImage = "/clinic.jpg"

export function ClinicSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-40%", "40%"]);

  return (
    <section ref={ref} className="relative z-10 h-[100vh] overflow-hidden">
      {/* Image — 180% tall, centered, lots to reveal */}
      <motion.div
        className="absolute inset-0 w-full -top-[40%]"
        style={{ y, height: "180%" }}
      >
        <img
          src={clinicImage}
          alt="Dentify clinic interior"
          loading="lazy"
          className="h-full w-full object-cover object-center"
        />
      </motion.div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/40 dark:via-black/30 dark:to-black/70" />

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-8 pb-16 sm:px-16">
        <Reveal>
          <h2 className="mb-16 text-center text-5xl font-light leading-[1] tracking-tight text-white sm:text-6xl text-balance">
            A clinic that feels nothing like a clinic.
          </h2>
        </Reveal>

        <div className="mx-auto max-w-5xl">
          <div className="mb-10 h-px w-full bg-background/20" />
          <div className="grid grid-cols-3">
            {[
              { value: "12k+", label: "Smiles crafted" },
              { value: "18", label: "Years of care" },
              { value: "4.9★", label: "Patient rating" },
            ].map((stat, i) => (
              <Reveal key={stat.label} delay={i * 0.1}>
                <div className={`flex flex-col gap-2 px-8 text-white ${i > 0 ? "border-l border-white/20" : ""}`}>
                  <span className="font-grotesk text-5xl font-light sm:text-7xl">{stat.value}</span>
                  <span className="text-sm font-medium uppercase tracking-[0.2em] text-white/60">{stat.label}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
