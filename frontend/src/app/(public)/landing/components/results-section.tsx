import { Check } from "lucide-react";
import { Reveal, Stagger, itemVariants } from "./primitives";
import smileDetail from "@/assets/smile-detail.jpg";
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

const resultImage = "/smile-detail.jpg"; 
 

export function ResultsSection() {
  const [pos, setPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const handle = (clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, p)));
  };

  useEffect(() => {
    const move = (e: MouseEvent) => dragging.current && handle(e.clientX);
    const touch = (e: TouchEvent) => dragging.current && handle(e.touches[0].clientX);
    const up = () => (dragging.current = false);
    window.addEventListener("mousemove", move);
    window.addEventListener("touchmove", touch);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("touchmove", touch);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchend", up);
    };
  }, []);

  return (
    <section id="results" className="relative z-10 px-6 py-16">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <Reveal>
            <div className="mb-3 text-xs uppercase tracking-[0.22em] text-primary">— Results</div>
            <h2 className="font-display text-5xl leading-[1] tracking-tight sm:text-6xl text-balance">
              The same patient. <span className="italic gradient-text">Six visits apart.</span>
            </h2>
            <p className="mt-6 max-w-md text-muted-foreground">
              Drag the divider to reveal a full porcelain veneer transformation — designed digitally,
              hand-finished in our in-house lab.
            </p>
            <Stagger className="mt-8 space-y-3" delay={0.08}>
              {[
                "Digital smile design preview",
                "In-house ceramic lab",
                "12-year material warranty",
              ].map((t) => (
                <motion.div key={t} variants={itemVariants} className="flex items-center gap-3 text-sm">
                  <Check className="h-4 w-4 text-primary" />
                  {t}
                </motion.div>
              ))}
            </Stagger>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div
            ref={containerRef}
            className="relative aspect-[5/4] cursor-ew-resize overflow-hidden rounded-3xl bg-mist select-none"
            onMouseDown={(e) => {
              dragging.current = true;
              handle(e.clientX);
            }}
            onTouchStart={(e) => {
              dragging.current = true;
              handle(e.touches[0].clientX);
            }}
          >
            <img src={resultImage} alt="After" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
            >
              <img
                src={resultImage}
                alt="Before"
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
                style={{ filter: "grayscale(0.7) brightness(0.85) contrast(0.9)" }}
              />
            </div>
            <div className="absolute top-4 left-4 rounded-full bg-foreground/70 px-3 py-1 text-xs uppercase tracking-wider text-background backdrop-blur">
              Before
            </div>
            <div className="absolute top-4 right-4 rounded-full bg-primary px-3 py-1 text-xs uppercase tracking-wider text-primary-foreground">
              After
            </div>
            <div
              className="absolute inset-y-0 z-10 w-px bg-background shadow-[0_0_30px_oklch(1_0_0/0.6)]"
              style={{ left: `${pos}%` }}
            >
              <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 grid h-12 w-12 place-items-center rounded-full bg-background text-foreground shadow-xl">
                <span className="text-xs">⇆</span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
