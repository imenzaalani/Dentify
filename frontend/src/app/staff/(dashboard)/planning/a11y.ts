import type { KeyboardEvent } from "react"

// Appointment cards, month-view mini cards, and list rows across day-view,
// week-view and planning-main are all divs (not <button>s) — they need to
// stay divs because several of them nest their own real <button>s (check-in,
// "Supprimer", the actions menu) or a native HTML5 drag handle, and a
// <button> can't contain another interactive <button> without breaking
// semantics. This gives that div the same landmarks the browser would give
// a real button — focusable, announced as "button" by a screen reader, and
// activatable with Enter or Space — without changing the element type.
// Always combine with a visible focus ring in the caller's className
// (e.g. "outline-none focus-visible:ring-2 focus-visible:ring-primary"),
// since a plain div has no default focus style of its own.
export function cardA11yProps(label: string, onActivate: () => void) {
  return {
    role: "button" as const,
    tabIndex: 0,
    "aria-label": label,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return
      e.preventDefault()
      e.stopPropagation()
      onActivate()
    },
  }
}