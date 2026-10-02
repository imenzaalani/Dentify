"use client"

import * as React from "react"
import {
  LayoutDashboard,
  ClipboardList,
  CalendarClock,
  FolderOpen,
  MessageCircle,
  Bot,
} from "lucide-react"
import { SharedSidebar } from "@/components/shared-sidebar"
import { PatientNavUser } from "@/components/patient/patient-nav-user"
import { Sidebar } from "@/components/ui/sidebar"
import { useAuth } from "@/lib/auth"
import { getAssetUrl } from "@/lib/api/client"
import { useTranslation } from "@/hooks/use-translation"

function getNavGroups(t: ReturnType<typeof useTranslation>["t"]) {
  return [
    {
      label: t("mySpace"),
      items: [
        { title: t("dashboard"), url: "/patient/dashboard", icon: LayoutDashboard },
        { title: t("myTreatment"), url: "/patient/treatment", icon: ClipboardList },
        { title: t("appointments"), url: "/patient/appointment", icon: CalendarClock },
        { title: t("documents"), url: "/patient/documents", icon: FolderOpen },
      ],
    },
    {
      label: t("communication"),
      items: [
        { title: t("messages"), url: "/patient/messages", icon: MessageCircle },
        { title: t("aiAssistant"), url: "/patient/assistant", icon: Bot },
      ],
    },
  ]
}

export function PatientSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation("nav")
  const navGroups = getNavGroups(t)
  const { user } = useAuth()

  const currentPatient = {
    name: [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "Patient",
    email: user?.email ?? "",
    avatarUrl: getAssetUrl(user?.avatar_url) ?? "",
  }

  return (
    <SharedSidebar
      {...props}
      title="Dentify"
      subtitle={t("patientSpace")}
      logoHref="/patient/dashboard"
      navGroups={navGroups}
      footerContent={<PatientNavUser user={currentPatient} />}
    />
  )
}