"use client"

import * as React from "react"
import {
  LayoutDashboard,
  CalendarClock,
  Users,
  UserPlus2,
  ClipboardList,
  FolderOpen,
  Receipt,
  BarChart3,
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
import { useAuth } from "@/lib/auth"
import { getAssetUrl } from "@/lib/api/client"
import { useTranslation } from "@/hooks/use-translation"
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

function getNavData(t: ReturnType<typeof useTranslation>["t"]) {
  return {
    navGroups: [
      {
        label: t("main"),
        roles: ["receptionist", "dentist", "owner"] as Role[],
        items: [
          {
            title: t("overview"),
            url: "/staff/dashboard",
            icon: LayoutDashboard,
          },
          {
            title: t("appointments"),
            url: "/staff/planning",
            icon: CalendarClock,
          },
          {
            title: t("patients"),
            url: "/staff/patients",
            icon: Users,
          },
          {
            title: t("leads"),
            url: "/staff/leads",
            icon: UserPlus2,
          },
        ],
      },
      {
        label: t("clinical"),
        // Receptionists don't have clinical access — see dentapp-frontend-review.md §2.1.
        roles: ["dentist", "owner"] as Role[],
        items: [
          {
            title: t("treatmentPlans"),
            url: "/staff/treatments",
            icon: ClipboardList,
          },
          {
            title: t("referrals"),
            url: "/staff/referrals",
            icon: Share2,
          },
          {
            title: t("documents"),
            url: "/staff/documents",
            icon: FolderOpen,
          },
        ],
      },
      {
        label: t("finance"),
        // Receptionists handle front-desk payments/invoices day to day.
        roles: ["receptionist", "dentist", "owner"] as Role[],
        items: [
          {
            title: t("billing"),
            url: "/staff/billing",
            icon: Receipt,
          },
          {
            title: t("statistics"),
            url: "/staff/statistics",
            icon: BarChart3,
          },
        ],
      },
      {
        label: t("administration"),
        roles: ["owner"] as Role[],
        items: [
          {
            title: t("staffManagement"),
            url: "/staff/team",
            icon: Users,
          },
          {
            title: t("settings"),
            url: "/staff/configuration",
            icon: SlidersHorizontal,
          },
          {
            title: t("globalReports"),
            url: "/staff/reports",
            icon: LineChart,
          },
          {
            title: t("audit"),
            url: "/staff/audit",
            icon: ShieldAlert,
          },
          {
            title: t("integrations"),
            url: "/staff/integrations",
            icon: Plug,
          },
        ],
      },
    ],
  }
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation("nav")
  const navData = getNavData(t)
  const currentRole = useCurrentRole()
  const { user } = useAuth()
  const effectiveRole: Role = currentRole ?? "receptionist"
  const visibleGroups = navData.navGroups.filter((group) =>
    group.roles.includes(effectiveRole)
  )

  const displayName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.email ?? "Staff member"

  const navUser = {
    name: displayName,
    email: user?.email ?? "",
    avatarUrl: getAssetUrl(user?.avatar_url),
  }

  return (
    <SharedSidebar
      {...props}
      title="Dentify"
      subtitle={t("dentalPractice")}
      logoHref="/staff/dashboard"
      navGroups={visibleGroups.map(({ roles, ...group }) => group)}
      footerContent={
        <>
          <SidebarGroup>
            <SidebarGroupLabel className="sr-only">{t("other")}</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/admin" target="_blank">
                    <ExternalLink />
                    <span>{t("patientPortalPreview")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          <NavUser user={navUser} />
        </>
      }
    />
  )
}