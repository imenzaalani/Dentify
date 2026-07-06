"use client"

import { useState } from "react"
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

import initialCareTypesData from "../../planning/data/care-types.json"

export function CareTypesTab() {
  const [careTypes, setCareTypes] = useState<CareType[]>(
    initialCareTypesData as CareType[]
  )
  const [formOpen, setFormOpen] = useState(false)
  const [editingCareType, setEditingCareType] = useState<CareType | null>(null)
  const [deletingCareType, setDeletingCareType] = useState<CareType | null>(
    null
  )

  const handleAdd = () => {
    setEditingCareType(null)
    setFormOpen(true)
  }

  const handleEdit = (careType: CareType) => {
    setEditingCareType(careType)
    setFormOpen(true)
  }

  const handleSave = (data: Omit<CareType, "id"> & { id?: string }) => {
    if (data.id) {
      setCareTypes((prev) =>
        prev.map((c) =>
          c.id === data.id
            ? {
                ...c,
                name: data.name,
                category: data.category,
                defaultDuration: data.defaultDuration,
                color: data.color,
                price: data.price,
                reimbursableAmount: data.reimbursableAmount,
                active: data.active,
              }
            : c
        )
      )
      toast.success(`${data.name} mis à jour`)
    } else {
      const newCareType: CareType = {
        id: `${data.category}-${Date.now()}`,
        name: data.name,
        category: data.category,
        defaultDuration: data.defaultDuration,
        color: data.color,
        price: data.price,
        reimbursableAmount: data.reimbursableAmount,
        active: data.active,
      }
      setCareTypes((prev) => [...prev, newCareType])
      toast.success(`${newCareType.name} ajouté au catalogue`)
    }
  }

  const handleToggleActive = (careType: CareType) => {
    setCareTypes((prev) =>
      prev.map((c) =>
        c.id === careType.id ? { ...c, active: !c.active } : c
      )
    )
  }

  const handleConfirmDelete = () => {
    if (!deletingCareType) return
    setCareTypes((prev) => prev.filter((c) => c.id !== deletingCareType.id))
    toast.success(`${deletingCareType.name} supprimé du catalogue`)
    setDeletingCareType(null)
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
        {careTypes.length === 0 ? (
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