import { Paperclip } from "lucide-react"

import { cn } from "@/lib/utils"
import type { ClinicMessage } from "@/hooks/use-clinic-messages"

export function MessageBubble({ message }: { message: ClinicMessage }) {
  const isPatient = message.sender === "patient"
  const time = new Date(message.createdAt).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div className={cn("flex flex-col gap-1", isPatient ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-lg px-3 py-2 text-sm",
          isPatient ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        {message.content}
        {message.attachment && (
          <div
            className={cn(
              "mt-2 flex items-center gap-2 rounded-md px-2 py-1.5 text-xs",
              isPatient ? "bg-primary-foreground/10" : "bg-background"
            )}
          >
            <Paperclip className="size-3.5 shrink-0" />
            <span className="truncate">{message.attachment.name}</span>
          </div>
        )}
      </div>
      <span className="px-1 text-[10px] text-muted-foreground">
        {time}
        {isPatient && !message.read ? " · sent" : ""}
      </span>
    </div>
  )
}