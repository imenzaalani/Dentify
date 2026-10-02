"use client"

import { useEffect, useState } from "react"
import { Armchair, DoorOpen, Pencil, Plus, Trash2 } from "lucide-react"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import type { Resource, ResourceFormData } from "../types"
import { ResourceFormDialog } from "./resource-form-dialog"

import { resourceApi } from "@/lib/api/resources"
import { ApiError } from "@/lib/api/client"

export function ResourcesTab() {
  const [resources, setResources] = useState<Resource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<Resource | null>(null)
  const [deletingResource, setDeletingResource] = useState<Resource | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    resourceApi
      .listResources(true) // include inactive — this tab manages all of them
      .then((data) => {
        if (!cancelled) setResources(data)
      })
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.message : "Échec du chargement des ressources")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleAdd = () => {
    setEditingResource(null)
    setFormOpen(true)
  }

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource)
    setFormOpen(true)
  }

  const handleSave = async (data: ResourceFormData) => {
    try {
      if (data.id) {
        const updated = await resourceApi.updateResource(data.id, {
          name: data.name,
          type: data.type,
          active: data.active,
        })
        setResources((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
        toast.success(`${updated.name} mis à jour`)
      } else {
        const created = await resourceApi.createResource({ name: data.name, type: data.type })
        setResources((prev) => [...prev, created])
        toast.success(`${created.name} ajouté`)
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Échec de l'enregistrement")
    }
  }

  const handleToggleActive = async (resource: Resource) => {
    try {
      const updated = await resourceApi.updateResource(resource.id, { active: !resource.active })
      setResources((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Échec de la mise à jour")
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingResource) return
    try {
      await resourceApi.deleteResource(deletingResource.id)
      setResources((prev) => prev.filter((r) => r.id !== deletingResource.id))
      toast.success(`${deletingResource.name} supprimé`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Échec de la suppression")
    } finally {
      setDeletingResource(null)
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Fauteuils &amp; Salles</CardTitle>
          <CardDescription>
            Ressources du cabinet auxquelles un rendez-vous peut être rattaché,
            en plus du praticien — utile dès que plusieurs soins se déroulent en
            parallèle.
          </CardDescription>
        </div>
        <Button className="cursor-pointer shrink-0 gap-2" onClick={handleAdd}>
          <Plus className="size-4" />
          Ajouter
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Chargement…</p>
        ) : resources.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center">
            <p className="text-sm font-medium">Aucune ressource configurée</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Ajoutez un fauteuil ou une salle pour rattacher un rendez-vous à une ressource précise.
            </p>
            <Button className="mt-4 cursor-pointer gap-2" onClick={handleAdd}>
              <Plus className="size-4" />
              Créer une ressource
            </Button>
          </div>
        ) : (
          resources.map((resource) => (
            <div key={resource.id} className="flex items-center gap-3 rounded-lg border p-3">
              {resource.type === "chair" ? (
                <Armchair className="size-4 shrink-0 text-muted-foreground" />
              ) : (
                <DoorOpen className="size-4 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{resource.name}</p>
                <p className="text-xs text-muted-foreground">
                  {resource.type === "chair" ? "Fauteuil" : "Salle"}
                </p>
              </div>
              <Badge variant={resource.active ? "secondary" : "outline"} className="shrink-0">
                {resource.active ? "Active" : "Inactive"}
              </Badge>
              <Switch
                checked={resource.active}
                onCheckedChange={() => handleToggleActive(resource)}
                className="cursor-pointer shrink-0"
                aria-label={`Basculer l'activation de ${resource.name}`}
              />
              <Button
                size="icon"
                variant="ghost"
                className="size-8 shrink-0 cursor-pointer"
                onClick={() => handleEdit(resource)}
                aria-label={`Modifier ${resource.name}`}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-8 shrink-0 cursor-pointer text-destructive hover:text-destructive"
                onClick={() => setDeletingResource(resource)}
                aria-label={`Supprimer ${resource.name}`}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))
        )}
      </CardContent>

      <ResourceFormDialog
        resource={editingResource}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSave={handleSave}
      />

      <Dialog
        open={deletingResource !== null}
        onOpenChange={(open) => !open && setDeletingResource(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cette ressource ?</DialogTitle>
            <DialogDescription>
              {deletingResource && (
                <>
                  {deletingResource.name} sera retiré définitivement. Les rendez-vous déjà planifiés sur cette ressource ne seront plus rattachés à un fauteuil ou une salle. Cette action est irréversible.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setDeletingResource(null)}
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