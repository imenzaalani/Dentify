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

// TODO: replace with the authenticated patient's real name/email/avatar
// once auth is wired up (spec 3.2 "Authentification Patient").
const CURRENT_PATIENT = {
  name: "Patient",
  email: "patient@example.com",
  avatar: "",
}

const navGroups = [
  {
    label: "My Space",
    items: [
      { title: "Dashboard", url: "/patient/dashboard", icon: LayoutDashboard },
      { title: "My Treatment", url: "/patient/treatment", icon: ClipboardList },
      { title: "Appointments", url: "/patient/appointment", icon: CalendarClock },
      { title: "Documents", url: "/patient/documents", icon: FolderOpen },
    ],
  },
  {
    label: "Communication",
    items: [
      { title: "Messages", url: "/patient/messages", icon: MessageCircle },
      { title: "AI Assistant", url: "/patient/assistant", icon: Bot },
    ],
  },
]

export function PatientSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <SharedSidebar
      {...props}
      title="Dentify"
      subtitle="Patient Space"
      logoHref="/patient/dashboard"
      navGroups={navGroups}
      footerContent={<PatientNavUser user={CURRENT_PATIENT} />}
    />
  )
}
