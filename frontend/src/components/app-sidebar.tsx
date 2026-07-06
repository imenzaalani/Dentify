"use client"

import * as React from "react"
import {
  LayoutDashboard,
  CalendarClock,
  Users,
  ClipboardList,
  FolderOpen,
  Receipt,
  BarChart3,
  Stethoscope,
  Share2,
  SlidersHorizontal,
  LineChart,
  ShieldAlert,
  Plug,
  ExternalLink,
  HelpCircle,
} from "lucide-react"
import Link from "next/link"
import { SharedSidebar } from "@/components/shared-sidebar"
import { NavUser } from "@/components/nav-user"
import { type StaffRole as Role, useCurrentRole } from "@/lib/rbac"
import {
  Sidebar,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Role/CURRENT_ROLE now live in @/lib/rbac — single source of truth shared
// with the route guards and the patient dossier's role-conditional sections.

const data = {
  user: {
    name: "Dr. Example",
    email: "dentist@dentapp.tn",
    avatar: "",
  },
  navGroups: [
    {
      label: "Main",
      roles: ["receptionist", "dentist", "owner"] as Role[],
      items: [
        {
          title: "Overview",
          url: "/staff/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Appointments",
          url: "/staff/planning",
          icon: CalendarClock,
        },
        {
          title: "Patients",
          url: "/staff/patients",
          icon: Users,
        },
      ],
    },
    {
      label: "Clinical",
      // Receptionists don't have clinical access — see dentapp-frontend-review.md §2.1.
      roles: ["dentist", "owner"] as Role[],
      items: [
        {
          title: "Treatment Plans",
          url: "/staff/treatments",
          icon: ClipboardList,
        },
        {
          title: "Referrals",
          url: "/staff/referrals",
          icon: Share2,
        },
        {
          title: "Documents",
          url: "/staff/documents",
          icon: FolderOpen,
        },
      ],
    },
    {
      label: "Finance",
      // Receptionists handle front-desk payments/invoices day to day.
      roles: ["receptionist", "dentist", "owner"] as Role[],
      items: [
        {
          title: "Billing",
          url: "/staff/billing",
          icon: Receipt,
        },
        {
          title: "Statistics",
          url: "/staff/statistics",
          icon: BarChart3,
        },
      ],
    },
    {
      label: "Administration",
      roles: ["owner"] as Role[],
      items: [
        {
          title: "Doctors",
          url: "/staff/doctors",
          icon: Stethoscope,
        },
        {
          title: "Settings",
          url: "/staff/configuration",
          icon: SlidersHorizontal,
        },
        {
          title: "Global Reports",
          url: "/staff/reports",
          icon: LineChart,
        },
        {
          title: "Audit Logs",
          url: "/staff/audit",
          icon: ShieldAlert,
        },
        {
          title: "Integrations",
          url: "/staff/integrations",
          icon: Plug,
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const currentRole = useCurrentRole()
  const visibleGroups = data.navGroups.filter((group) =>
    group.roles.includes(currentRole)
  )

  return (
    <SharedSidebar
      {...props}
      title="Dentify"
      subtitle="Dental Practice"
      logoHref="/staff/dashboard"
      navGroups={visibleGroups.map(({ roles, ...group }) => group)}
      footerContent={
        <>
          <SidebarGroup>
            <SidebarGroupLabel className="sr-only">Other</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/admin" target="_blank">
                    <ExternalLink />
                    <span>Patient Portal (preview)</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          <NavUser user={data.user} />
        </>
      }
    />
  )
}