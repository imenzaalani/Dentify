import { Skeleton } from "@/components/ui/skeleton"

// Loading placeholder shown while page.tsx fetches dentists/patients/care
// types/appointments/waitlist in parallel. Mirrors the real shell in
// planning.tsx (sidebar + header + tab row + day-view grid) instead of a
// generic spinner, so the page doesn't visually "pop" once data arrives —
// the layout is already where it's going to be, just filled in.

// A handful of fixed-width/height bars standing in for appointment cards on
// the skeleton grid — varied so the columns don't look like a repeated
// pattern. Values are illustrative pixel offsets/heights, not real slots.
const FAKE_CARDS = [
  { top: 24, height: 64 },
  { top: 112, height: 40 },
  { top: 176, height: 88 },
]
const FAKE_CARDS_SPARSE = [
  { top: 56, height: 56 },
  { top: 168, height: 40 },
]

function SidebarSkeleton() {
  return (
    <div className="hidden xl:flex flex-col h-full w-80 border-r shrink-0">
      <div className="p-6 border-b">
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
      {/* Mini date picker */}
      <div className="p-4 border-b space-y-3">
        <Skeleton className="h-4 w-24" />
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 28 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-sm" />
          ))}
        </div>
      </div>
      {/* Practitioner list */}
      <div className="p-4 border-b space-y-3">
        <Skeleton className="h-4 w-28" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-sm shrink-0" />
            <Skeleton className="h-2.5 w-2.5 rounded-full shrink-0" />
            <Skeleton className="h-3.5 flex-1" />
          </div>
        ))}
      </div>
      {/* Waitlist widget */}
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-14 w-full rounded-md" />
        <Skeleton className="h-14 w-full rounded-md" />
      </div>
    </div>
  )
}

function GridColumnSkeleton({ cards }: { cards: { top: number; height: number }[] }) {
  return (
    <div className="flex-1 min-w-[200px] border-r last:border-r-0">
      <div className="h-12 border-b flex items-center gap-2 px-3">
        <Skeleton className="h-2.5 w-2.5 rounded-full shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-2.5 w-1/2" />
        </div>
      </div>
      <div className="relative" style={{ height: 420 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="absolute left-0 right-0 border-t border-border/40" style={{ top: i * 70 }} />
        ))}
        {cards.map((card, i) => (
          <Skeleton
            key={i}
            className="absolute left-1 right-1 rounded-md"
            style={{ top: card.top, height: card.height }}
          />
        ))}
      </div>
    </div>
  )
}

function MainPanelSkeleton() {
  return (
    <div className="flex-1 min-w-0 flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col gap-4 p-6 border-b">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-8 w-56" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-64 rounded-md hidden md:block" />
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
        </div>
        {/* Tab row */}
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-md" />
          ))}
        </div>
      </div>

      {/* Grid: time gutter + a few practitioner columns */}
      <div className="flex-1 min-h-0 flex">
        <div className="w-16 shrink-0 border-r">
          <div className="h-12 border-b" />
          <div className="relative" style={{ height: 420 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="absolute right-2 h-2.5 w-8" style={{ top: i * 70 }} />
            ))}
          </div>
        </div>
        <GridColumnSkeleton cards={FAKE_CARDS} />
        <GridColumnSkeleton cards={FAKE_CARDS_SPARSE} />
        <GridColumnSkeleton cards={FAKE_CARDS} />
      </div>
    </div>
  )
}

export function PlanningSkeleton() {
  return (
    <div className="px-4 lg:px-6" aria-busy="true" aria-label="Chargement du planning">
      <div className="border rounded-lg bg-background relative">
        <div className="flex min-h-[800px]">
          <SidebarSkeleton />
          <MainPanelSkeleton />
        </div>
      </div>
    </div>
  )
}