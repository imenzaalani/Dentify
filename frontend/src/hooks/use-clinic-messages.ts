"use client"

import * as React from "react"

export interface ClinicMessageAttachment {
  name: string
  sizeKb: number
}

export interface ClinicMessage {
  id: string
  sender: "patient" | "clinic"
  content: string
  createdAt: string // ISO
  read: boolean
  attachment?: ClinicMessageAttachment
}

// TODO: replace with a real store hydrated from the messages endpoint once
// it exists. Module-level state mirrors use-patient-assistant.ts so the
// pattern is consistent across both chat surfaces.
let listeners: Array<() => void> = []
let messages: ClinicMessage[] = [
  {
    id: "m1",
    sender: "clinic",
    content:
      "Hi! Just a reminder that your next adjustment is on July 14th at 10:00. Let us know if you need to reschedule.",
    createdAt: "2026-07-01T15:20:00.000Z",
    read: true,
  },
  {
    id: "m2",
    sender: "patient",
    content: "Thanks, that works for me. Should I take anything before the appointment?",
    createdAt: "2026-07-01T15:32:00.000Z",
    read: true,
  },
  {
    id: "m3",
    sender: "clinic",
    content:
      "No need to prepare anything special — just brush normally beforehand. See you then!",
    createdAt: "2026-07-01T16:05:00.000Z",
    read: false,
  },
]

function notify() {
  listeners.forEach((l) => l())
}

export const MAX_ATTACHMENT_SIZE_KB = 10 * 1024 // 10MB cap per spec

export function useClinicMessages() {
  const [, forceRender] = React.useReducer((c) => c + 1, 0)

  React.useEffect(() => {
    listeners.push(forceRender)
    return () => {
      listeners = listeners.filter((l) => l !== forceRender)
    }
  }, [])

  const sendMessage = React.useCallback(
    (content: string, attachment?: ClinicMessageAttachment) => {
      const trimmed = content.trim()
      if (!trimmed && !attachment) return

      const message: ClinicMessage = {
        id: crypto.randomUUID(),
        sender: "patient",
        content: trimmed,
        createdAt: new Date().toISOString(),
        read: true,
        attachment,
      }
      messages = [...messages, message]
      notify()
    },
    []
  )

  const markAllRead = React.useCallback(() => {
    const hasUnread = messages.some((m) => m.sender === "clinic" && !m.read)
    if (!hasUnread) return
    messages = messages.map((m) => (m.sender === "clinic" ? { ...m, read: true } : m))
    notify()
  }, [])

  return { messages, sendMessage, markAllRead }
}