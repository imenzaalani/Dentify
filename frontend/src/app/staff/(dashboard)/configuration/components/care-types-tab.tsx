"use client"

import { useEffect, useState } from "react"
import { Pencil, Plus, Stethoscope, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import type { CareType } from "../../planning/types"
import { categoryLabels } from "../../planning/types"
import { CareTypeFormDialog } from "./care-type-form-dialog"

import { careTypeApi } from "@/lib/api/care-types"
import { ApiError } from "@/lib/api/client"
import type { CareType as ApiCareType } from "@/types/care-type"

// planning/types.ts keeps duration as a display string ("30 min",
// "1.5 hours"); the API stores minutes (int) for scheduling math later.
// Converting at this boundary means CareTypeFormDialog needs no changes.
function minutesToDuration(minutes: number): string {
  if (minutes % 60 === 0) {
    const hours = minutes / 60
    return hours < 1 ? `${minutes} min` : `${hours} hour${hours === 1 ? "" : "s"}`
  }
  if (minutes > 60) return `${(minutes / 60).toFixed(1)} hours`
  return `${minutes} min`
}

function durationToMinutes(duration: string): number {
  const match = duration.trim().match(/^(\d+(\.\d+)?)/)
  const value = match ? parseFloat(match[1]) : 30
  return /hour|h\b/i.test(duration) ? Math.round(value * 60) : Math.round(value)
}

function apiToUi(c: ApiCareType): CareType {
  return {
    id: c.id,
    name: c.name,
    category: c.category,
    defaultDuration: minutesToDuration(c.default_duration_minutes),
    color: c.color,
    active: c.active,
    price: Number(c.price),
    reimbursableAmount: c.reimbursable_amount != null ? Number(c.reimbursable_amount) : undefined,
  }
}

export function CareTypesTab() {
  const [careTypes, setCareTypes] = useState<CareType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingCareType, setEditingCareType] = useState<CareType | null>(null)
  const [deletingCareType, setDeletingCareType] = useState<CareType | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    careTypeApi
      .listCareTypes(true) // include inactive — this tab manages the whole catalogue
      .then((data) => {
        if (!cancelled) setCareTypes(data.map(apiToUi))
      })
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.message : "Échec du chargement du catalogue")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleAdd = () => {
    setEditingCareType(null)
    setFormOpen(true)
  }

  const handleEdit = (careType: CareType) => {
    setEditingCareType(careType)
    setFormOpen(true)
  }

  const handleSave = async (data: Omit<CareType, "id"> & { id?: string }) => {
    try {
      if (data.id) {
        const updated = await careTypeApi.updateCareType(data.id, {
          name: data.name,
          category: data.category,
          default_duration_minutes: durationToMinutes(data.defaultDuration),
          color: data.color,
          active: data.active,
          price: data.price,
          reimbursable_amount: data.reimbursableAmount ?? null,
        })
        setCareTypes((prev) => prev.map((c) => (c.id === updated.id ? apiToUi(updated) : c)))
        toast.success(`${updated.name} mis à jour`)
      } else {
        const created = await careTypeApi.createCareType({
          name: data.name,
          category: data.category,
          default_duration_minutes: durationToMinutes(data.defaultDuration),
          color: data.color,
          price: data.price,
          reimbursable_amount: data.reimbursableAmount ?? null,
        })
        setCareTypes((prev) => [...prev, apiToUi(created)])
        toast.success(`${created.name} ajouté au catalogue`)
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Échec de l'enregistrement")
    }
  }

  const handleToggleActive = async (careType: CareType) => {
    try {
      const updated = await careTypeApi.updateCareType(careType.id, { active: !careType.active })
      setCareTypes((prev) => prev.map((c) => (c.id === updated.id ? apiToUi(updated) : c)))
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Échec de la mise à jour")
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingCareType) return
    try {
      await careTypeApi.deleteCareType(deletingCareType.id)
      setCareTypes((prev) => prev.filter((c) => c.id !== deletingCareType.id))
      toast.success(`${deletingCareType.name} supprimé du catalogue`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Échec de la suppression")
    } finally {
      setDeletingCareType(null)
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Actes &amp; Tarifs</CardTitle>
          <CardDescription>
            Catalogue des actes/soins proposés par le cabinet — utilisé pour la
            planification des rendez-vous, la facturation, et calculé
            automatiquement pour le montant remboursable CNAM.
          </CardDescription>
        </div>
        <Button className="cursor-pointer shrink-0 gap-2" onClick={handleAdd}>
          <Plus className="size-4" />
          Ajouter un acte
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Chargement…</p>
        ) : careTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center">
            <p className="text-sm font-medium">Aucun acte configuré</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Ajoutez un acte pour l&apos;utiliser dans la planification et la
              facturation.
            </p>
            <Button className="mt-4 cursor-pointer gap-2" onClick={handleAdd}>
              <Plus className="size-4" />
              Créer un acte
            </Button>
          </div>
        ) : (
          careTypes.map((careType) => (
            <div
              key={careType.id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <span
                className={`size-2 shrink-0 rounded-full ${careType.color}`}
                aria-hidden
              />
              <Stethoscope className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{careType.name}</p>
                <p className="text-xs text-muted-foreground">
                  {categoryLabels[careType.category]} · {careType.defaultDuration}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-medium">
                  {careType.price.toLocaleString("fr-TN")} TND
                </p>
                {!!careType.reimbursableAmount && (
                  <p className="text-xs text-muted-foreground">
                    dont {careType.reimbursableAmount} TND CNAM
                  </p>
                )}
              </div>
              <Badge
                variant={careType.active ? "secondary" : "outline"}
                className="shrink-0"
              >
                {careType.active ? "Actif" : "Inactif"}
              </Badge>
              <Switch
                checked={careType.active}
                onCheckedChange={() => handleToggleActive(careType)}
                className="cursor-pointer shrink-0"
                aria-label={`Basculer l'activation de ${careType.name}`}
              />
              <Button
                size="icon"
                variant="ghost"
                className="size-8 shrink-0 cursor-pointer"
                onClick={() => handleEdit(careType)}
                aria-label={`Modifier ${careType.name}`}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-8 shrink-0 cursor-pointer text-destructive hover:text-destructive"
                onClick={() => setDeletingCareType(careType)}
                aria-label={`Supprimer ${careType.name}`}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))
        )}
      </CardContent>

      <CareTypeFormDialog
        careType={editingCareType}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSave={handleSave}
      />

      <Dialog
        open={deletingCareType !== null}
        onOpenChange={(open) => !open && setDeletingCareType(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cet acte ?</DialogTitle>
            <DialogDescription>
              {deletingCareType && (
                <>
                  {deletingCareType.name} sera retiré du catalogue. Les
                  rendez-vous et factures existants qui y font référence ne
                  seront pas modifiés. Cette action est irréversible.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setDeletingCareType(null)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              className="cursor-pointer border border-red-600 bg-red-600 text-white shadow-sm hover:border-red-700 hover:bg-red-700 dark:border-red-500 dark:bg-red-500 dark:hover:border-red-400 dark:hover:bg-red-400"
              onClick={handleConfirmDelete}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}