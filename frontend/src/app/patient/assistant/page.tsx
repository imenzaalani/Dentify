"use client"

import * as React from "react"
import { Bot, Send, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { usePatientAssistant } from "@/hooks/use-patient-assistant"

export default function PatientAssistantPage() {
  const [draft, setDraft] = React.useState("")
  const { messages, sendMessage } = usePatientAssistant()
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  const handleSend = () => {
    if (!draft.trim()) return
    sendMessage(draft)
    setDraft("")
  }

  return (
    <div className="flex h-[calc(100vh-var(--header-height)-3rem)] flex-col px-4 lg:px-6">
      <div className="@container/main mb-4">
        <h1 className="text-2xl font-semibold">Assistant IA</h1>
        <p className="text-sm text-muted-foreground">
          Historique complet de vos échanges avec l&apos;assistant du cabinet.
        </p>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto rounded-lg border bg-muted/20 p-4"
      >
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex items-start gap-3",
                m.sender === "patient" && "flex-row-reverse"
              )}
            >
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full",
                  m.sender === "patient"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {m.sender === "patient" ? (
                  <User className="size-4" />
                ) : (
                  <Bot className="size-4" />
                )}
              </div>
              <div
                className={cn(
                  "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                  m.sender === "patient"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background"
                )}
              >
                {m.content}
                <div
                  className={cn(
                    "mt-1 text-[10px] opacity-60",
                    m.sender === "patient" ? "text-right" : "text-left"
                  )}
                >
                  {new Date(m.createdAt).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-2xl items-end gap-2 py-4">
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
          className="min-h-10 resize-none"
          rows={1}
        />
        <Button size="icon" onClick={handleSend} aria-label="Envoyer">
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  )
}
