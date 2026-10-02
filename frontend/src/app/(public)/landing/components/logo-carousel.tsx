"use client"

export function LogoCarousel() {
  const items = [
    "Invisalign Diamond",
    "ISO 9001 Certified",
    "Digital Smile Design",
    "3Shape TRIOS",
    "Zeiss Microscope",
    "Straumann Implants",
    "ADA Accredited",
  ]
  const row = [...items, ...items]

  return (
    <section className="relative z-10 overflow-hidden border-y border-border/40 bg-white/5 backdrop-blur-lg max-md:backdrop-blur-none py-6 min-h-[96px] flex items-center">
      <div
        className="flex items-center gap-12 whitespace-nowrap px-6 w-max"
        style={{ animation: "marquee 30s linear infinite", willChange: "transform" }}
      >
        {row.map((t, i) => (
          <span
            key={i}
            className="flex items-center gap-6 text-base sm:text-lg leading-none uppercase tracking-[0.28em] text-muted-foreground/80"
          >
            {t}
            <span className="text-muted-foreground/40 text-base sm:text-lg">
              ✺
            </span>
          </span>
        ))}
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  )
}