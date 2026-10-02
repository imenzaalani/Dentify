import * as React from "react"
import { AlertCircle, CheckCircle2, Info } from "lucide-react"
import { cn } from "@/lib/utils"

type FormStatusVariant = "error" | "success" | "info"

interface FormStatusProps extends React.HTMLAttributes<HTMLDivElement> {
  variant: FormStatusVariant
  title?: string
}

const variantConfig: Record<
  FormStatusVariant,
  { icon: React.ElementType; className: string; iconClassName: string }
> = {
  error: {
    icon: AlertCircle,
    className:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400",
    iconClassName: "text-red-500 dark:text-red-400",
  },
  success: {
    icon: CheckCircle2,
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400",
    iconClassName: "text-emerald-500 dark:text-emerald-400",
  },
  info: {
    icon: Info,
    className:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-400",
    iconClassName: "text-blue-500 dark:text-blue-400",
  },
}

export function FormStatus({
  variant,
  title,
  className,
  children,
  ...props
}: FormStatusProps) {
  const config = variantConfig[variant]
  const Icon = config.icon

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-2xl border px-3 py-1.5 text-xs font-medium",
        config.className,
        className
      )}
      {...props}
    >
      <Icon className={cn("size-4 shrink-0", config.iconClassName)} />
      <div className="min-w-0">
        {title ? (
          <p className="whitespace-nowrap">{title}</p>
        ) : null}
        <div className={cn("leading-snug", title ? "mt-0.5 text-[13px] opacity-90" : "")}>{children}</div>
      </div>
    </div>
  )
}