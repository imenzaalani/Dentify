"use client"

import * as React from "react"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export interface SharedSidebarNavItem {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  items?: Array<{
    title: string
    url: string
    isActive?: boolean
  }>
}

export interface SharedSidebarNavGroup {
  label: string
  items: SharedSidebarNavItem[]
}

interface SharedSidebarProps extends React.ComponentProps<typeof Sidebar> {
  title: string
  subtitle: string
  logoHref: string
  navGroups: SharedSidebarNavGroup[]
  footerContent?: React.ReactNode
}

export function SharedSidebar({
  title,
  subtitle,
  logoHref,
  navGroups,
  footerContent,
  ...props
}: SharedSidebarProps) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={logoHref}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Logo size={24} className="text-current" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{title}</span>
                  <span className="truncate text-xs">{subtitle}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>
      {footerContent ? <SidebarFooter>{footerContent}</SidebarFooter> : null}
    </Sidebar>
  )
}
