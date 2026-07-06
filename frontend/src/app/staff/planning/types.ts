export type AppointmentStatus =
  | "pending"    // en attente de confirmation
  | "confirmed"  // confirmé
  | "arrived"    // patient pointé en salle d'attente par le secrétariat
  | "completed"  // terminé
  | "cancelled"  // annulé
  | "no_show"    // absent

export type CareCategory =
  | "soins_courants" // consultation, détartrage...
  | "chirurgie"      // extraction, implant...
  | "orthodontie"
  | "esthetique"
  | "urgence"

export interface CareType {
  id: string
  name: string           // "Détartrage", "Extraction"...
  category: CareCategory
  defaultDuration: string // "30 min", "1 hour"...
  color: string           // tailwind bg-* class, per category
  active: boolean
  price: number               // TND, tarif cabinet
  reimbursableAmount?: number // TND, montant anticipé remboursable (CNAM), optionnel en v1
}

// Fauteuil ou salle de soin — un rendez-vous s'y rattache en plus du praticien,
// pour permettre à un cabinet d'avoir plusieurs fauteuils/praticiens en parallèle.
export interface Resource {
  id: string
  name: string // "Fauteuil 1", "Salle 2"...
  type: "chair" | "room"
  active: boolean
}

export interface Practitioner {
  id: string
  firstName: string
  lastName: string
  initials: string
  specialty: string
  color: string      // tailwind bg-* class, ColorPicker in real app
  visible: boolean
}

export interface Patient {
  id: string
  firstName: string
  lastName: string
  initials: string
  phone: string
  email?: string
}

export interface Appointment {
  id: number
  patientId: string
  patientName: string
  patientInitials: string
  dentistId: string
  dentistName: string
  resourceId?: string // fauteuil/salle occupé, en plus du praticien
  date: Date
  time: string
  duration: string
  careTypeId: string
  careLabel: string
  category: CareCategory
  status: AppointmentStatus
  color: string // derived from care category, used for calendar blocks
  treatmentStepId?: string
  prepNotes?: string   // notes préparatoires, visibles patient
  internalNotes?: string // notes internes
  sendConfirmation?: boolean
  cancellationReason?: string
}

export const statusLabels: Record<AppointmentStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmé",
  arrived: "Arrivé",
  completed: "Terminé",
  cancelled: "Annulé",
  no_show: "Absent",
}

export const statusColors: Record<AppointmentStatus, string> = {
  pending: "bg-orange-500",
  confirmed: "bg-blue-500",
  arrived: "bg-teal-500",
  completed: "bg-green-500",
  cancelled: "bg-gray-400",
  no_show: "bg-red-600",
}

// Liste d'attente : proposer un créneau libéré à un patient qui souhaitait
// une date/plage indisponible au moment de sa demande.
export type WaitlistPriority = "low" | "medium" | "high"
export type WaitlistStatus = "waiting" | "contacted" | "scheduled" | "cancelled"

export interface WaitlistEntry {
  id: string
  patientId: string
  patientName: string
  careTypeId: string
  desiredDateRange: { from: string; to: string } // ISO dates
  priority: WaitlistPriority
  status: WaitlistStatus
  notes?: string
  createdAt: string
}

export const categoryColors: Record<CareCategory, string> = {
  soins_courants: "bg-blue-500",
  chirurgie: "bg-red-500",
  orthodontie: "bg-purple-500",
  esthetique: "bg-pink-500",
  urgence: "bg-orange-500",
}

export const categoryLabels: Record<CareCategory, string> = {
  soins_courants: "Soins courants",
  chirurgie: "Chirurgie",
  orthodontie: "Orthodontie",
  esthetique: "Esthétique",
  urgence: "Urgence",
}
