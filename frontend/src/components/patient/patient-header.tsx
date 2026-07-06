"use client"

import * as React from "react"
import {
  Bot,
  CalendarClock,
  ClipboardList,
  FolderOpen,
  LayoutDashboard,
  MessageCircle,
} from "lucide-react"
import { SharedHeader } from "@/components/shared-header"

export function PatientHeader() {
  return (
    <SharedHeader
      showSearch
      showNotifications
      showModeToggle
      notificationButtonVariant="outline"
      notificationButtonClassName="h-9 w-9 border-border/70 bg-background/80"
      notificationTitle="Notifications"
      searchItems={[
        {
          title: "Dashboard",
          url: "/patient/dashboard",
          group: "Patient Portal",
          icon: LayoutDashboard,
        },
        {
          title: "My Treatment",
          url: "/patient/treatment",
          group: "Patient Portal",
          icon: ClipboardList,
        },
        {
          title: "Appointments",
          url: "/patient/appointment",
          group: "Patient Portal",
          icon: CalendarClock,
        },
        {
          title: "Documents",
          url: "/patient/documents",
          group: "Patient Portal",
          icon: FolderOpen,
        },
        {
          title: "Messages",
          url: "/patient/messages",
          group: "Patient Portal",
          icon: MessageCircle,
        },
        {
          title: "AI Assistant",
          url: "/patient/assistant",
          group: "Patient Portal",
          icon: Bot,
        },
      ]}
      notifications={[
        {
          id: "n1",
          type: "reminder",
          title: "Appointment Reminder",
          message: "Your appointment with Dr. Ben Youssef is in 2 days.",
          date: "2026-07-08T09:00:00.000Z",
          read: false,
        },
        {
          id: "n2",
          type: "message",
          title: "New message from the clinic",
          message: "We have answered your question about preparation before treatment.",
          date: "2026-07-01T15:20:00.000Z",
          read: false,
        },
        {
          id: "n3",
          type: "document",
          title: "New document available",
          message: "Your quote for orthodontic treatment is ready.",
          date: "2026-06-28T11:05:00.000Z",
          read: true,
        },
        {
          id: "n4",
          type: "document",
          title: "Report added",
          message: "The report of your last visit has been added to your documents.",
          date: "2026-06-20T08:45:00.000Z",
          read: true,
        },
      ]}
    />
  )
}
