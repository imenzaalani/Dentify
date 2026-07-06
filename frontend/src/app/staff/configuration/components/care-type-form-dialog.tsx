"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { CareType, CareCategory } from "../../planning/types"
import { categoryLabels } from "../../planning/types"

interface CareTypeFormDialogProps {
  careType?: CareType | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (careType: Omit<CareType, "id"> & { id?: string }) => void
}

const categoryColorMap: Record<CareCategory, string> = {
  soins_courants: "bg-blue-500",
  chirurgie: "bg-red-500",
  orthodontie: "bg-purple-500",
  esthetique: "bg-pink-500",
  urgence: "bg-orange-500",
}

export function CareTypeFormDialog({
  careType,
  open,
  onOpenChange,
  onSave,
}: CareTypeFormDialogProps) {
  const [name, setName] = useState(careType?.name ?? "")
  const [category, setCategory] = useState<CareCategory>(
    careType?.category ?? "soins_courants"
  )
  const [defaultDuration, setDefaultDuration] = useState(
    careType?.defaultDuration ?? "30 min"
  )
  const [price, setPrice] = useState(careType?.price?.toString() ?? "")
  const [reimbursableAmount, setReimbursableAmount] = useState(
    careType?.reimbursableAmount?.toString() ?? ""
  )
  const [active, setActive] = useState(careType?.active ?? true)

  useEffect(() => {
    if (open) {
      setName(careType?.name ?? "")
      setCategory(careType?.category ?? "soins_courants")
      setDefaultDuration(careType?.defaultDuration ?? "30 min")
      setPrice(careType?.price?.toString() ?? "")
      setReimbursableAmount(careType?.reimbursableAmount?.toString() ?? "")
      setActive(careType?.active ?? true)
    }
  }, [open, careType])

  const handleSave = () => {
    if (!name.trim() || !price) return
    onSave({
      id: careType?.id,
      name: name.trim(),
      category,
      defaultDuration: defaultDuration.trim() || "30 min",
      color: categoryColorMap[category],
      active,
      price: Number(price),
      reimbursableAmount: reimbursableAmount ? Number(reimbursableAmount) : 0,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {careType ? "Modifier l'acte" : "Nouvel acte"}
          </DialogTitle>
          <DialogDescription>
            Un acte/soin proposé par le cabinet, utilisé dans la planification, la
            facturation et le catalogue patient.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="care-type-name">Nom *</Label>
            <Input
              id="care-type-name"
              placeholder="Détartrage, Extraction..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Catégorie *</Label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as CareCategory)}
            >
              <SelectTrigger className="w-full cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value} className="cursor-pointer">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="care-type-duration">Durée par défaut *</Label>
              <Input
                id="care-type-duration"
                placeholder="30 min"
                value={defaultDuration}
                onChange={(e) => setDefaultDuration(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="care-type-price">Tarif (TND) *</Label>
              <Input
                id="care-type-price"
                type="number"
                min={0}
                step={0.01}
                placeholder="90"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="care-type-reimbursable">
              Montant remboursable CNAM (TND)
            </Label>
            <Input
              id="care-type-reimbursable"
              type="number"
              min={0}
              step={0.01}
              placeholder="0"
              value={reimbursableAmount}
              onChange={(e) => setReimbursableAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Optionnel — laissez vide si non pris en charge.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="care-type-active">Actif</Label>
              <p className="text-xs text-muted-foreground">
                Désactivez pour le retirer temporairement du catalogue sans le
                supprimer.
              </p>
            </div>
            <Switch
              id="care-type-active"
              checked={active}
              onCheckedChange={setActive}
              className="cursor-pointer"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button
            className="cursor-pointer"
            onClick={handleSave}
            disabled={!name.trim() || !price}
          >
            {careType ? "Enregistrer" : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}