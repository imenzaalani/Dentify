"use client"

import * as React from "react"

import { MessageBubble } from "./components/message-bubble"
import { MessageComposer } from "./components/message-composer"
import { useClinicMessages } from "@/hooks/use-clinic-messages"

export default function PatientMessagesPage() {
  const { messages, sendMessage, markAllRead } = useClinicMessages()
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    markAllRead()
  }, [markAllRead])

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  return (
    <div className="flex h-[calc(100vh-var(--header-height)-3rem)] flex-col px-4 lg:px-6">
      <div className="@container/main mb-4">
        <h1 className="text-2xl font-semibold">Messages</h1>
        <p className="text-sm text-muted-foreground">
          Secure conversation with your dental clinic.
        </p>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-lg border">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
          <div className="mx-auto flex max-w-2xl flex-col gap-4">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
          </div>
        </div>
        <div className="mx-auto w-full max-w-2xl">
          <MessageComposer onSend={sendMessage} />
        </div>
      </div>
    </div>
  )
}
