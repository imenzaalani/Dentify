"use client"

import { useEffect, useState } from "react"
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

import { patientApi } from "@/lib/api/patients"
import { treatmentApi } from "@/lib/api/treatments"
import { ApiError } from "@/lib/api/client"

import {
  TreatmentFormSheet,
  type TreatmentFormValues,
} from "../components/treatment-form-sheet"
import { statusBadge, type TreatmentPlan } from "../components/data-table"
import { buildUpdatePayload, mapTreatmentPlan, toSimplePatient, type SimplePatient } from "../data"

export default function TreatmentPreviewPage() {
  const params = useParams<{ id: string }>()
  const planId = params.id

  const [plan, setPlan] = useState<TreatmentPlan | null>(null)
  const [patients, setPatients] = useState<SimplePatient[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const [patientsRes, planRes] = await Promise.all([
          patientApi.listPatients(),
          treatmentApi.getTreatmentPlan(planId),
        ])
        if (cancelled) return
        const mappedPatients = patientsRes.map(toSimplePatient)
        setPatients(mappedPatients)
        setPlan(mapTreatmentPlan(planRes, mappedPatients))
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 404) {
            setNotFound(true)
          } else {
            toast.error("Couldn't load this treatment plan", {
              description: err instanceof Error ? err.message : undefined,
            })
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [planId])

  if (loading) {
    return (
      <div className="@container/main px-4 lg:px-6 py-16 text-center text-sm text-muted-foreground">
        Loading treatment plan…
      </div>
    )
  }

  if (notFound || !plan) {
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

  const toggleStep = async (stepId: string) => {
    const step = plan.steps.find((s) => s.id === stepId)
    if (!step) return
    const nextStatus = step.status === "completed" ? "pending" : "completed"
    try {
      const updated = await treatmentApi.updateStepStatus(plan.id, stepId, nextStatus)
      setPlan(mapTreatmentPlan(updated, patients))
    } catch (err) {
      toast.error("Couldn't update this step", {
        description: err instanceof Error ? err.message : undefined,
      })
    }
  }

  const handleAbandon = async () => {
    try {
      const updated = await treatmentApi.updateTreatmentPlanStatus(plan.id, "abandoned")
      setPlan(mapTreatmentPlan(updated, patients))
      toast.success("Treatment plan marked as abandoned")
    } catch (err) {
      toast.error("Couldn't mark the plan as abandoned", {
        description: err instanceof Error ? err.message : undefined,
      })
    }
  }

  const handleEdit = async (data: TreatmentFormValues) => {
    try {
      const updated = await treatmentApi.updateTreatmentPlan(plan.id, buildUpdatePayload(data))
      setPlan(mapTreatmentPlan(updated, patients))
      toast.success(`Treatment plan "${data.title}" updated`)
    } catch (err) {
      toast.error("Couldn't update the treatment plan", {
        description: err instanceof Error ? err.message : undefined,
      })
    }
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
        patients={patients}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={handleEdit}
      />
    </div>
  )
}
