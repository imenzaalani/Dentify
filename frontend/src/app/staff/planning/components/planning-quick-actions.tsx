"use client"

import {
  Clock,
  Plus,
  CalendarOff,
  Printer,
  Bell,
  AlertTriangle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface PlanningQuickActionsProps {
  onNewAppointment?: () => void
  onBlockSlot?: () => void
  onSendReminder?: () => void
  onPrint?: () => void
}

export function PlanningQuickActions({
  onNewAppointment,
  onBlockSlot,
  onSendReminder,
  onPrint,
}: PlanningQuickActionsProps) {
  const quickStats = [
    { label: "RDV aujourd'hui", value: "3", color: "bg-blue-500" },
    { label: "Cette semaine", value: "12", color: "bg-green-500" },
    { label: "En attente de confirmation", value: "2", color: "bg-orange-500" },
  ]

  return (
    <div className="space-y-4">
      {/* Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Aperçu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {quickStats.map((stat, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${stat.color}`} />
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
              <Badge variant="secondary">{stat.value}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Actions rapides</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start cursor-pointer" onClick={onNewAppointment}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau RDV
          </Button>

          <Button variant="outline" className="w-full justify-start cursor-pointer" onClick={onBlockSlot}>
            <CalendarOff className="w-4 h-4 mr-2" />
            Bloquer un créneau
          </Button>

          <Button variant="outline" className="w-full justify-start cursor-pointer" onClick={onSendReminder}>
            <Bell className="w-4 h-4 mr-2" />
            Envoyer un rappel
          </Button>

          <Separator className="my-3" />

          <Button variant="ghost" size="sm" className="w-full justify-start cursor-pointer" onClick={onPrint}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimer le planning
          </Button>
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Alertes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">RDV dans 1h non confirmé</p>
              <p className="text-xs text-muted-foreground">Yasmine Cherif · 14h00</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">RDV non confirmé depuis 48h</p>
              <p className="text-xs text-muted-foreground">Walid Saidi · Pose de bagues</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next up */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Prochains RDV
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Mohamed Gharbi</p>
              <p className="text-xs text-muted-foreground">9h00 · Détartrage · Dr. Ben Salah</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Ines Khelifi</p>
              <p className="text-xs text-muted-foreground">14h00 · Suivi orthodontique · Dr. Trabelsi</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
