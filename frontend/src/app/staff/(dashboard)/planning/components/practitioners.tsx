"use client"

import { Check, ChevronRight, Eye, EyeOff, MoreHorizontal } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { practitionerSwatch } from "../data"
import { type Practitioner } from "../types"

interface PractitionersProps {
  practitioners: Practitioner[]
  onPractitionerToggle: (practitionerId: string) => void
  onPractitionerEdit?: (practitionerId: string) => void
}

export function Practitioners({
  practitioners,
  onPractitionerToggle,
  onPractitionerEdit,
}: PractitionersProps) {
  return (
    <div className="space-y-4">
      <Collapsible defaultOpen className="group/collapsible">
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer">
          <span className="text-sm font-medium">Praticiens</span>
          <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="mt-2 space-y-1">
            {practitioners.map((item) => (
              <div key={item.id} className="group/practitioner-item">
                <div className="flex items-center justify-between p-2 hover:bg-accent/50 rounded-md">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Color & Visibility Toggle */}
                    <button
                      onClick={() => onPractitionerToggle(item.id)}
                      aria-pressed={item.visible}
                      title={item.visible ? "Masquer dans le planning" : "Afficher dans le planning"}
                      style={item.visible ? practitionerSwatch(item.color).style : undefined}
                      className={cn(
                        "flex aspect-square size-5 shrink-0 items-center justify-center rounded-md border-2 transition-all cursor-pointer",
                        item.visible
                          ? cn("border-transparent text-white shadow-sm", practitionerSwatch(item.color).className)
                          : "border-border bg-transparent hover:border-foreground/40"
                      )}
                    >
                      {item.visible && <Check className="size-3.5" strokeWidth={3} />}
                    </button>

                    {/* Name + specialty */}
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => onPractitionerToggle(item.id)}
                    >
                      <p
                        className={cn(
                          "truncate text-sm",
                          !item.visible && "text-muted-foreground"
                        )}
                      >
                        Dr. {item.firstName} {item.lastName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.specialty}
                      </p>
                    </div>

                    {/* Visibility Icon */}
                    <div className="opacity-0 group-hover/practitioner-item:opacity-100">
                      {item.visible ? (
                        <Eye className="h-3 w-3 text-muted-foreground" />
                      ) : (
                        <EyeOff className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>

                    {/* More Options */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <div
                          className="h-5 w-5 flex items-center justify-center p-0 opacity-0 group-hover/practitioner-item:opacity-100 cursor-pointer hover:bg-accent rounded-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" side="right">
                        <DropdownMenuItem
                          onClick={() => onPractitionerEdit?.(item.id)}
                          className="cursor-pointer"
                        >
                          Voir le profil
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onPractitionerToggle(item.id)}
                          className="cursor-pointer"
                        >
                          {item.visible ? "Masquer" : "Afficher"} dans le planning
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
