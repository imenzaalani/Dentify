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
import type { Resource } from "../types"

interface ResourceFormDialogProps {
  resource?: Resource | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (resource: Omit<Resource, "id"> & { id?: string }) => void
}

export function ResourceFormDialog({
  resource,
  open,
  onOpenChange,
  onSave,
}: ResourceFormDialogProps) {
  const [name, setName] = useState(resource?.name ?? "")
  const [type, setType] = useState<Resource["type"]>(resource?.type ?? "chair")
  const [active, setActive] = useState(resource?.active ?? true)

  useEffect(() => {
    if (open) {
      setName(resource?.name ?? "")
      setType(resource?.type ?? "chair")
      setActive(resource?.active ?? true)
    }
  }, [open, resource])

  const handleSave = () => {
    if (!name.trim()) return
    onSave({ id: resource?.id, name: name.trim(), type, active })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{resource ? "Modifier la ressource" : "Nouvelle ressource"}</DialogTitle>
          <DialogDescription>
            Un fauteuil ou une salle auquel un rendez-vous peut être rattaché, en plus du praticien.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="resource-name">Nom *</Label>
            <Input
              id="resource-name"
              placeholder="Fauteuil 1, Salle de chirurgie..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Type *</Label>
            <Select value={type} onValueChange={(value) => setType(value as Resource["type"])}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chair">Fauteuil</SelectItem>
                <SelectItem value="room">Salle</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="resource-active">Active</Label>
              <p className="text-xs text-muted-foreground">
                Désactivez pour la retirer temporairement du planning sans la supprimer.
              </p>
            </div>
            <Switch id="resource-active" checked={active} onCheckedChange={setActive} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button className="cursor-pointer" onClick={handleSave} disabled={!name.trim()}>
            {resource ? "Enregistrer" : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
