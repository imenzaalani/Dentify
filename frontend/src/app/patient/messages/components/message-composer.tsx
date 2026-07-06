"use client"

import * as React from "react"
import { Paperclip, Send, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MAX_ATTACHMENT_SIZE_KB, type ClinicMessageAttachment } from "@/hooks/use-clinic-messages"

export function MessageComposer({
  onSend,
}: {
  onSend: (content: string, attachment?: ClinicMessageAttachment) => void
}) {
  const [draft, setDraft] = React.useState("")
  const [attachment, setAttachment] = React.useState<ClinicMessageAttachment | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    const isAllowedType = file.type.startsWith("image/") || file.type === "application/pdf"
    if (!isAllowedType) {
      toast.error("Only images and PDF files are allowed.")
      return
    }
    const sizeKb = Math.round(file.size / 1024)
    if (sizeKb > MAX_ATTACHMENT_SIZE_KB) {
      toast.error("File is too large.", { description: "Maximum size is 10MB." })
      return
    }
    setAttachment({ name: file.name, sizeKb })
  }

  const handleSend = () => {
    if (!draft.trim() && !attachment) return
    onSend(draft, attachment ?? undefined)
    setDraft("")
    setAttachment(null)
  }

  return (
    <div className="flex flex-col gap-2 border-t p-3">
      {attachment && (
        <div className="flex w-fit items-center gap-2 rounded-md bg-muted px-2 py-1 text-xs">
          <Paperclip className="size-3.5" />
          <span className="max-w-[200px] truncate">{attachment.name}</span>
          <button onClick={() => setAttachment(null)} aria-label="Remove attachment">
            <X className="size-3.5 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach a file"
        >
          <Paperclip className="size-4" />
        </Button>
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder="Write a message to the clinic..."
          className="min-h-9 resize-none"
          rows={1}
        />
        <Button size="icon" onClick={handleSend} aria-label="Send">
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  )
}