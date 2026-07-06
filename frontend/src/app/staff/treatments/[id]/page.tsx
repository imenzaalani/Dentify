"use client"

import { useMemo, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import {
  ArrowLeft,
  Ban,
  CalendarDays,
  CheckCircle2,
  Circle,
  ClipboardList,
  FileText,
  Pencil,
  Stethoscope,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import initialPlansData from "../data.json"
import patientsData from "../../patients/data.json"
import {
  TreatmentFormSheet,
  type TreatmentFormValues,
} from "../components/treatment-form-sheet"
import { statusBadge, type TreatmentPlan } from "../components/data-table"

const patients = patientsData as {
  id: number
  firstName: string
  lastName: string
  avatar: string
}[]

const plansSeed = initialPlansData as TreatmentPlan[]

export default function TreatmentPreviewPage() {
  const params = useParams<{ id: string }>()
  const planId = Number(params.id)

  const [plan, setPlan] = useState<TreatmentPlan | null>(
    () => plansSeed.find((p) => p.id === planId) ?? null
  )
  const [editOpen, setEditOpen] = useState(false)

  useMemo(() => patients.find((p) => p.id === plan?.patientId), [plan?.patientId])

  if (!plan) {
    return (
      <div className="@container/main px-4 lg:px-6 py-16 flex flex-col items-center gap-3 text-center">
        <ClipboardList className="size-10 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Treatment plan not found</h1>
        <p className="text-sm text-muted-foreground">This plan may have been removed.</p>
        <Button asChild variant="outline" className="cursor-pointer">
          <Link href="/staff/treatments">
            <ArrowLeft className="mr-2 size-4" />
            Back to Treatment Plans
          </Link>
        </Button>
      </div>
    )
  }

  const total = plan.steps.length
  const done = plan.steps.filter((s) => s.status === "completed").length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  const toggleStep = (stepId: string) => {
    setPlan((prev) => {
      if (!prev) return prev
      const steps = prev.steps.map((s) =>
        s.id === stepId
          ? { ...s, status: (s.status === "completed" ? "pending" : "completed") as "pending" | "completed" }
          : s
      )
      const allDone = steps.every((s) => s.status === "completed")
      return {
        ...prev,
        steps,
        status:
          prev.status === "Abandoned"
            ? prev.status
            : allDone
            ? "Completed"
            : "In Progress",
      }
    })
  }

  const handleAbandon = () => {
    setPlan((prev) => (prev ? { ...prev, status: "Abandoned" } : prev))
    toast.success("Treatment plan marked as abandoned")
  }

  const handleEdit = (data: TreatmentFormValues) => {
    setPlan((prev) => {
      if (!prev) return prev
      const p = patients.find((pt) => pt.id === Number(data.patientId))
      return {
        ...prev,
        patientId: Number(data.patientId),
        patientName: p ? `${p.firstName} ${p.lastName}` : prev.patientName,
        patientAvatar: p?.avatar ?? prev.patientAvatar,
        title: data.title,
        diagnosis: data.diagnosis,
        startDate: data.startDate.toISOString().split("T")[0],
        endDate: data.endDate ? data.endDate.toISOString().split("T")[0] : null,
        notes: data.notes,
        steps: data.steps.map((step, index) => {
          const existing = prev.steps[index]
          return {
            id: existing ? existing.id : `new-${Date.now()}-${index}`,
            label: step.label,
            tooth: step.tooth,
            estDuration: step.estDuration,
            status: existing ? existing.status : ("pending" as const),
          }
        }),
      }
    })
    toast.success(`Treatment plan "${data.title}" updated`)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="@container/main px-4 lg:px-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <Button asChild variant="ghost" size="sm" className="w-fit cursor-pointer -ml-2">
            <Link href="/staff/treatments">
              <ArrowLeft className="mr-2 size-4" />
              Back to Treatment Plans
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{plan.title}</h1>
            {statusBadge(plan.status)}
          </div>
          <p className="text-sm text-muted-foreground">
            Created {new Date(plan.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="cursor-pointer" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 size-4" />
            Edit plan
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="cursor-pointer text-destructive hover:text-destructive"
                disabled={plan.status === "Abandoned"}
              >
                <Ban className="mr-2 size-4" />
                Mark as abandoned
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Abandon this treatment plan?</DialogTitle>
                <DialogDescription>
                  This marks &quot;{plan.title}&quot; as abandoned. It will no longer count
                  toward active plans.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" className="cursor-pointer">
                    Cancel
                  </Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button
                    className="cursor-pointer bg-destructive hover:bg-destructive/90"
                    onClick={handleAbandon}
                  >
                    Abandon plan
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="@container/main px-4 lg:px-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground font-medium">Patient</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Link
              href={`/staff/patients/${plan.patientId}`}
              className="flex items-center gap-3 hover:underline"
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-sm font-medium">{plan.patientAvatar}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{plan.patientName}</span>
            </Link>

            <Separator />

            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="size-4" />
                <span>
                  {new Date(plan.startDate).toLocaleDateString()} –{" "}
                  {plan.endDate ? new Date(plan.endDate).toLocaleDateString() : "Ongoing"}
                </span>
              </div>
              {plan.diagnosis && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <Stethoscope className="size-4 mt-0.5" />
                  <span>{plan.diagnosis}</span>
                </div>
              )}
              {plan.notes && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <FileText className="size-4 mt-0.5" />
                  <span>{plan.notes}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-muted-foreground font-medium">Procedure Steps</CardTitle>
            <span className="text-sm text-muted-foreground">{done}/{total} completed</span>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Progress value={pct} className="h-1.5" />
            <div className="flex flex-col gap-2">
              {plan.steps.map((step, index) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => toggleStep(step.id)}
                  className="flex items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 cursor-pointer"
                >
                  {step.status === "completed" ? (
                    <CheckCircle2 className="size-5 mt-0.5 text-green-600 dark:text-green-400 shrink-0" />
                  ) : (
                    <Circle className="size-5 mt-0.5 text-muted-foreground shrink-0" />
                  )}
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span
                      className={`text-sm font-medium ${
                        step.status === "completed" ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      Step {index + 1}: {step.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {step.tooth ? `Tooth ${step.tooth}` : "No tooth specified"}
                      {step.estDuration ? ` · ${step.estDuration} min` : ""}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <TreatmentFormSheet
        mode="edit"
        trigger={null}
        initialData={plan}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={handleEdit}
      />
    </div>
  )
}