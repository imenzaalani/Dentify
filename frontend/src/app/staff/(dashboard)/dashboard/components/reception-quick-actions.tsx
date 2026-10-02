import Link from "next/link"
import { UserPlus, CalendarPlus, Wallet, Printer } from "lucide-react"

import { Button } from "@/components/ui/button"

export function ReceptionQuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline" className="gap-2">
        <Link href="/staff/patients">
          <UserPlus className="size-4" />
          New Patient
        </Link>
      </Button>
      <Button asChild variant="outline" className="gap-2">
        <Link href="/staff/planning">
          <CalendarPlus className="size-4" />
          New Appointment
        </Link>
      </Button>
      <Button asChild variant="outline" className="gap-2">
        <Link href="/staff/billing">
          <Wallet className="size-4" />
          Collect Payment
        </Link>
      </Button>
      <Button asChild variant="outline" className="gap-2">
        <Link href="/staff/billing">
          <Printer className="size-4" />
          Print Invoice
        </Link>
      </Button>
    </div>
  )
}
