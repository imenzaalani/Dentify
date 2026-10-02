"use client"

import * as React from "react"
import { Bell, MessageCircle, FileText, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { CommandSearch, SearchTrigger, type SearchItem } from "@/components/command-search"
import { ModeToggle } from "@/components/mode-toggle"
import { LanguageSwitcher } from "@/components/language-switcher"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/hooks/use-translation"

export interface HeaderNotification {
  id: string
  type: "reminder" | "message" | "document"
  title: string
  message: string
  date: string
  read: boolean
}

interface SharedHeaderProps {
  className?: string
  showSearch?: boolean
  showNotifications?: boolean
  showModeToggle?: boolean
  searchPlaceholder?: string
  notificationButtonVariant?: "outline" | "ghost"
  notificationButtonClassName?: string
  notificationTitle?: string
  notifications?: HeaderNotification[]
  searchItems?: SearchItem[]
}

const ICONS: Record<HeaderNotification["type"], typeof Bell> = {
  reminder: Clock,
  message: MessageCircle,
  document: FileText,
}

function relativeTime(iso: string, t: ReturnType<typeof useTranslation>["t"]) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return t("today")
  if (diffDays === 1) return t("yesterday")
  return t("daysAgo", { count: diffDays })
}

export function SharedHeader({
  className,
  showSearch = true,
  showNotifications = true,
  showModeToggle = true,
  searchPlaceholder,
  notificationButtonVariant = "outline",
  notificationButtonClassName = "h-9 w-9 border-border/70 bg-background/80",
  notificationTitle,
  notifications: notificationsProp,
  searchItems,
}: SharedHeaderProps) {
  const { t } = useTranslation("notifications")
  const { t: tc } = useTranslation("common")
  const resolvedSearchPlaceholder = searchPlaceholder ?? tc("search")
  const resolvedNotificationTitle = notificationTitle ?? t("title")

  const defaultNotifications: HeaderNotification[] = [
    {
      id: "n1",
      type: "reminder",
      title: "New Patient Registration",
      message: "A new patient has registered in the system.",
      date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      read: false,
    },
    {
      id: "n2",
      type: "message",
      title: "Appointment Cancelled",
      message: "Patient John Doe has cancelled their appointment.",
      date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      read: false,
    },
    {
      id: "n3",
      type: "document",
      title: "Monthly Report Generated",
      message: "Your monthly clinic report is ready for review.",
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      read: true,
    },
  ]

  const [searchOpen, setSearchOpen] = React.useState(false)
  const [notifications, setNotifications] = React.useState<HeaderNotification[]>(
    notificationsProp ?? defaultNotifications
  )

  const unreadCount = notifications.filter((notification) => !notification.read).length

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    )
  }

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }

  React.useEffect(() => {
    if (!showSearch) return

    const down = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setSearchOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [showSearch])

  return (
    <>
      <header
        className={cn(
          "flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) print:hidden",
          className
        )}
      >
        <div className="flex w-full items-center gap-1 px-4 py-3 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1" />
          {showSearch && (
            <>
              <Separator
                orientation="vertical"
                className="mx-2 data-[orientation=vertical]:h-4"
              />
              <div className="flex-1 max-w-sm">
                <SearchTrigger
                  onClick={() => setSearchOpen(true)}
                  placeholder={resolvedSearchPlaceholder}
                />
              </div>
            </>
          )}
          <div className="ml-auto flex items-center gap-2">
            {showNotifications && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={notificationButtonVariant}
                    size="icon"
                    className={cn(
                      "relative h-9 w-9",
                      notificationButtonVariant === "outline" && "border-border/70 bg-background/80",
                      notificationButtonClassName
                    )}
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white shadow-sm ring-2 ring-background dark:bg-red-500">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="border-b p-4">
                    <div className="flex items-center justify-between">
                      <h2 className="font-semibold">{resolvedNotificationTitle}</h2>
                      {unreadCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 text-xs"
                          onClick={handleMarkAllAsRead}
                        >
                          {t("markAllRead")}
                        </Button>
                      )}
                    </div>
                  </div>
                  <ScrollArea className="h-[400px]">
                    {notifications.length === 0 ? (
                      <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
                        {t("empty")}
                      </div>
                    ) : (
                      <div className="divide-y">
                        {notifications.map((notification) => {
                          const Icon = ICONS[notification.type]
                          return (
                            <div
                              key={notification.id}
                              onClick={() => handleMarkAsRead(notification.id)}
                              className={cn(
                                "cursor-pointer p-4 transition-colors hover:bg-muted/50",
                                !notification.read && "bg-muted/30"
                              )}
                            >
                              <div className="flex gap-3">
                                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium">{notification.title}</p>
                                    {!notification.read && (
                                      <span className="h-2 w-2 rounded-full bg-primary" />
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {notification.message}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground/70">
                                    {relativeTime(notification.date, t)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            )}
            {showModeToggle && (
              <>
                <LanguageSwitcher variant={notificationButtonVariant} />
                <ModeToggle />
              </>
            )}
          </div>
        </div>
      </header>
      {showSearch && (
        <CommandSearch
          open={searchOpen}
          onOpenChange={setSearchOpen}
          searchItems={searchItems}
        />
      )}
    </>
  )
}