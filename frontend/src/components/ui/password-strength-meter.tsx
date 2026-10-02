import * as React from "react"
import { cn } from "@/lib/utils"

interface StrengthResult {
  score: 0 | 1 | 2 | 3 | 4
  label: string
}

function getStrength(password: string): StrengthResult {
  if (!password) return { score: 0, label: "" }

  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  const clamped = Math.min(4, score) as 0 | 1 | 2 | 3 | 4
  const labels = ["Very weak", "Weak", "Fair", "Good", "Strong"]
  return { score: clamped, label: labels[clamped] }
}

const barColors = [
  "bg-red-400",
  "bg-orange-400",
  "bg-amber-400",
  "bg-lime-500",
  "bg-emerald-500",
]

const labelColors = [
  "text-red-500",
  "text-orange-500",
  "text-amber-500",
  "text-lime-600",
  "text-emerald-600",
]

export function PasswordStrengthMeter({ password }: { password: string }) {
  const { score, label } = getStrength(password)

  if (!password) return null

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-1 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full bg-muted transition-colors",
              i < score && barColors[score]
            )}
          />
        ))}
      </div>
      <span className={cn("text-xs font-medium tabular-nums", labelColors[score])}>
        {label}
      </span>
    </div>
  )
}