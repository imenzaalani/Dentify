"use client"

import React from "react"
import { PatientSidebar } from "@/components/patient/patient-sidebar"
import { PatientHeader } from "@/components/patient/patient-header"
import { PatientChatWidget } from "@/components/patient/patient-chat-widget"
import { AuthGuard } from "@/components/auth-guard"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { useSidebarConfig } from "@/hooks/use-sidebar-config"

// Auto logout after 30 minutes of inactivity (spec 3.2 "Authentification
// Patient" — "Déconnexion automatique après 30 minutes d'inactivité").
const IDLE_TIMEOUT_MS = 30 * 60 * 1000
const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const

function useIdleLogout(timeoutMs: number) {
  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    const reset = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        // TODO: replace with real session teardown once auth is wired up
        window.location.href = "/sign-in"
      }, timeoutMs)
    }

    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, reset))
    reset()

    return () => {
      clearTimeout(timer)
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, reset))
    }
  }, [timeoutMs])
}

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { config } = useSidebarConfig()
  useIdleLogout(IDLE_TIMEOUT_MS)

  // Session check now goes through AuthGuard (see @/lib/rbac and
  // @/components/auth-guard) — no `roles` filter here since the patient
  // portal isn't staff-role-gated, it just needs a valid patient session.
  // TODO: once real patient auth exists, useAuthGuard's isAuthenticated
  // should reflect an actual patient session instead of the hardcoded true.

  return (
    <AuthGuard signInHref="/sign-in">
      <SidebarProvider
        style={
          {
            "--sidebar-width": "16rem",
            "--sidebar-width-icon": "3rem",
            "--header-height": "calc(var(--spacing) * 14)",
          } as React.CSSProperties
        }
        className={config.collapsible === "none" ? "sidebar-none-mode" : ""}
      >
        <PatientSidebar
          variant={config.variant}
          collapsible={config.collapsible}
          side={config.side}
        />
        <SidebarInset>
          <PatientHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                {children}
              </div>
            </div>
          </div>
        </SidebarInset>
        <PatientChatWidget />
      </SidebarProvider>
    </AuthGuard>
  )
}
