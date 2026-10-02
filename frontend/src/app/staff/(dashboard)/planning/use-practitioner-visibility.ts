"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { type Practitioner } from "./types"

// Which practitioners a staff member has hidden from the day view — a
// personal display preference, not clinic data, so it lives in
// localStorage rather than needing a backend column. Previously this was
// local useState *inside* the Practitioners list component, seeded once
// from props and never touched again: toggling only mutated that
// component's private copy, so it silently reset on every reload and never
// reacted to the practitioners prop changing underneath it.
const STORAGE_KEY = "dentify:planning:hidden-practitioner-ids"

function loadHiddenIds(): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

export function usePractitionerVisibility(practitioners: Practitioner[]) {
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => loadHiddenIds())

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(hiddenIds)))
    } catch {
      // Private browsing / quota — visibility just won't persist, not fatal.
    }
  }, [hiddenIds])

  const toggleVisibility = useCallback((id: string) => {
    setHiddenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // The practitioner list with hide/show actually applied — this is what
  // the sidebar and day view should render against.
  const practitionersWithVisibility = useMemo(
    () => practitioners.map((p) => ({ ...p, visible: !hiddenIds.has(p.id) })),
    [practitioners, hiddenIds]
  )

  return { practitioners: practitionersWithVisibility, toggleVisibility }
}
