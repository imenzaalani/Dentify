import { Planning } from "./components/planning"
import { appointments, appointmentDates, dentists, patients, careTypes, resources, waitlist } from "./data"

export default function PlanningPage() {
  return (
    <div className="px-4 lg:px-6">
      <Planning
        appointments={appointments}
        appointmentDates={appointmentDates}
        practitioners={dentists}
        patients={patients}
        careTypes={careTypes}
        resources={resources}
        waitlist={waitlist}
      />
    </div>
  )
}