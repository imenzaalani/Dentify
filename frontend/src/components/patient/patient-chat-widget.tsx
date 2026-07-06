"use client"

import * as React from "react"
import Link from "next/link"
import { Bot, Send, Maximize2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { usePatientAssistant } from "@/hooks/use-patient-assistant"

export function PatientChatWidget() {
  const [open, setOpen] = React.useState(false)
  const [draft, setDraft] = React.useState("")
  const { messages, sendMessage } = usePatientAssistant()
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages, open])

  const handleSend = () => {
    if (!draft.trim()) return
    sendMessage(draft)
    setDraft("")
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        className={cn(
          "fixed bottom-5 right-5 z-50 size-12 rounded-full shadow-lg",
          open && "pointer-events-none opacity-0"
        )}
        aria-label="Ouvrir l'assistant"
      >
        <Bot className="size-5" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-sm">
          <SheetHeader className="flex-row items-center justify-between space-y-0 border-b px-4 py-3">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Bot className="size-4" />
              Assistant
            </SheetTitle>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/patient/assistant" onClick={() => setOpen(false)} aria-label="Ouvrir en plein écran">
                <Maximize2 className="size-4" />
              </Link>
            </Button>
          </SheetHeader>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4">
            <div className="flex flex-col gap-3 py-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                    m.sender === "patient"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {m.content}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-end gap-2 border-t p-3">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Écrivez votre question..."
              className="min-h-9 resize-none"
              rows={1}
            />
            <Button size="icon" onClick={handleSend} aria-label="Envoyer">
              <Send className="size-4" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
