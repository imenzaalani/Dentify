import { NextAppointmentCard, type NextAppointment } from "./components/next-appointment-card"
import { TreatmentProgressCard, type TreatmentSummary } from "./components/treatment-progress-card"
import { NotificationsCard, type DashboardNotification } from "./components/notifications-card"
import { QuickActions } from "./components/quick-actions"

import dashboardData from "./data.json"

export default function PatientDashboardPage() {
  const { nextAppointment, treatment, notifications } = dashboardData as {
    nextAppointment: NextAppointment | null
    treatment: TreatmentSummary | null
    notifications: DashboardNotification[]
  }

  return (
    <>
      {/* Page Title and Description */}
      <div className="px-4 lg:px-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome — here&apos;s where you are in your care journey.
          </p>
        </div>
      </div>

      <div className="@container/main px-4 lg:px-6 space-y-6">
        <QuickActions />
      </div>

      <div className="@container/main px-4 lg:px-6 space-y-6">
        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs grid gap-4 md:grid-cols-2">
          <NextAppointmentCard appointment={nextAppointment} />
          <TreatmentProgressCard treatment={treatment} />
        </div>
      </div>

      <div className="@container/main px-4 lg:px-6 space-y-6">
        <NotificationsCard notifications={notifications} />
      </div>
    </>
  )
}
