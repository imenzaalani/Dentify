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

export type ResourceFormData = Omit<Resource, "id"> & { id?: string | null }

// Mirrors the backend's WorkingHourEntry (app/schemas/auth.py). `day` is a
// lowercase English weekday name ("monday".."sunday") to match how the
// staff working-hours editor writes it; `start`/`end` are "HH:mm" 24h.
export interface WorkingHourEntry {
  day: string
  start?: string | null
  end?: string | null
  off: boolean
}

export interface Practitioner {
  id: string
  firstName: string
  lastName: string
  initials: string
  specialty: string
  color: string      // tailwind bg-* class, ColorPicker in real app
  visible: boolean
  workingHours?: WorkingHourEntry[]
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
  id: string
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
  // Outcome of the confirmation email attempt — distinct from `status`.
  confirmationDeliveryStatus?: ConfirmationDeliveryStatus
  confirmationSentAt?: string
  cancellationReason?: string
  seriesId?: string // set when this occurrence belongs to a recurring series
  seriesOccurrenceIndex?: number
}

export type ConfirmationDeliveryStatus = "not_requested" | "sent" | "failed"

export const confirmationDeliveryLabels: Record<ConfirmationDeliveryStatus, string> = {
  not_requested: "Non demandée",
  sent: "Email envoyé",
  failed: "Échec d'envoi",
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

// Blocage d'un créneau (congé, pause, formation...) — indisponibilité posée
// par le cabinet, pas un rendez-vous patient. Local au planning pour l'instant
// (pas encore de table backend dédiée), au même titre que la liste d'attente
// avant son passage en API.
export type BlockReason = "conge" | "pause" | "formation" | "maintenance" | "autre"

export const blockReasonLabels: Record<BlockReason, string> = {
  conge: "Congé",
  pause: "Pause",
  formation: "Formation",
  maintenance: "Maintenance",
  autre: "Autre",
}

export interface BlockedSlot {
  id: string
  dentistId: string
  date: Date
  startTime: string // "9h00"
  endTime: string // "12h00"
  reason: BlockReason
  note?: string
}

// Liste d'attente : proposer un créneau libéré à un patient qui souhaitait
// une date/plage indisponible au moment de sa demande.
export type WaitlistPriority = "low" | "medium" | "high"
export type WaitlistStatus = "waiting" | "contacted" | "scheduled" | "cancelled"

// Shared between planning.tsx, planning-main.tsx and planning-sidebar.tsx so
// the sidebar's waitlist widget can switch the main panel to the waitlist tab.
export type PlanningViewMode = "day" | "week" | "month" | "list" | "waitlist"

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

// Calendar-block styling for appointment cards (day/week/month views):
// light tinted background + colored left accent bar + dark text, rather
// than the old solid-color-with-white-text blocks — easier to scan a full
// day and stacked/adjacent appointments no longer visually merge into one
// shape. Keyed by care category so it stays in sync with categoryColors
// above. Every class here is a literal (not built from a template string)
// so Tailwind's JIT scanner picks it up.
export interface CardStyle {
  bg: string
  border: string
  accent: string // border-l color, paired with border-l-4 on the card
  text: string
  textMuted: string
}

export const categoryCardStyles: Record<CareCategory, CardStyle> = {
  soins_courants: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-900",
    accent: "border-l-blue-500",
    text: "text-blue-950 dark:text-blue-100",
    textMuted: "text-blue-700/80 dark:text-blue-300/80",
  },
  chirurgie: {
    bg: "bg-red-50 dark:bg-red-950/40",
    border: "border-red-200 dark:border-red-900",
    accent: "border-l-red-500",
    text: "text-red-950 dark:text-red-100",
    textMuted: "text-red-700/80 dark:text-red-300/80",
  },
  orthodontie: {
    bg: "bg-purple-50 dark:bg-purple-950/40",
    border: "border-purple-200 dark:border-purple-900",
    accent: "border-l-purple-500",
    text: "text-purple-950 dark:text-purple-100",
    textMuted: "text-purple-700/80 dark:text-purple-300/80",
  },
  esthetique: {
    bg: "bg-pink-50 dark:bg-pink-950/40",
    border: "border-pink-200 dark:border-pink-900",
    accent: "border-l-pink-500",
    text: "text-pink-950 dark:text-pink-100",
    textMuted: "text-pink-700/80 dark:text-pink-300/80",
  },
  urgence: {
    bg: "bg-orange-50 dark:bg-orange-950/40",
    border: "border-orange-200 dark:border-orange-900",
    accent: "border-l-orange-500",
    text: "text-orange-950 dark:text-orange-100",
    textMuted: "text-orange-700/80 dark:text-orange-300/80",
  },
}

// Cancelled / no-show appointments — neutral regardless of care category,
// so a glance at the grid shows "this slot isn't real" before anything else.
export const mutedCardStyle: CardStyle = {
  bg: "bg-muted/60",
  border: "border-border",
  accent: "border-l-muted-foreground/40",
  text: "text-muted-foreground",
  textMuted: "text-muted-foreground/70",
}

export const categoryLabels: Record<CareCategory, string> = {
  soins_courants: "Soins courants",
  chirurgie: "Chirurgie",
  orthodontie: "Orthodontie",
  esthetique: "Esthétique",
  urgence: "Urgence",
}

// Recurring appointments — local UI shape for the form; converted to the
// API's RecurrenceRule (recurrence.frequency/count/until) at submit time.
export type RecurrenceFrequency = "weekly" | "biweekly" | "monthly"

export const recurrenceFrequencyLabels: Record<RecurrenceFrequency, string> = {
  weekly: "Toutes les semaines",
  biweekly: "Toutes les 2 semaines",
  monthly: "Tous les mois",
}