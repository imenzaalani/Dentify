"use client"

import * as React from "react"

export type AssistantSender = "patient" | "assistant"

export interface AssistantMessage {
  id: string
  sender: AssistantSender
  content: string
  createdAt: string // ISO string
}

// TODO: replace with a real store (Zustand/Context provider hydrated from
// GET /patient/assistant/history) once the backend endpoint exists. For now
// this is module-level state so the widget and the full page share one
// thread within a session, per spec 3.2 "historique des conversations".
let listeners: Array<() => void> = []
let messages: AssistantMessage[] = [
  {
    id: "seed-1",
    sender: "assistant",
    content:
      "Bonjour ! Je suis l'assistant du cabinet. Posez-moi une question sur vos soins, la préparation d'une intervention ou nos tarifs indicatifs.",
    createdAt: new Date().toISOString(),
  },
]

function notify() {
  listeners.forEach((l) => l())
}

// Very small canned-response mock so the UI has something real to render
// before the AI endpoint (spec 6.6 POST /ai/chat) is wired up.
function mockReply(userText: string): string {
  const text = userText.toLowerCase()
  if (text.includes("prix") || text.includes("tarif") || text.includes("coût")) {
    return "Les tarifs indicatifs sont disponibles sur la page Services. Pour un devis précis, je vous invite à en discuter avec votre praticien lors du prochain RDV."
  }
  if (text.includes("douleur") || text.includes("mal")) {
    return "Une gêne légère après un soin est normale les premières 24-48h. Si la douleur est intense ou persiste, contactez le cabinet directement via la messagerie."
  }
  if (text.includes("rdv") || text.includes("rendez-vous")) {
    return "Vous pouvez gérer vos rendez-vous depuis l'onglet \"Rendez-vous\" du portail — annulation, modification ou nouvelle prise de RDV."
  }
  return "Je note votre question. Si elle dépasse ce que je peux traiter, je vous mets en relation avec le cabinet via la messagerie."
}

export function usePatientAssistant() {
  const [, forceRender] = React.useReducer((c) => c + 1, 0)

  React.useEffect(() => {
    listeners.push(forceRender)
    return () => {
      listeners = listeners.filter((l) => l !== forceRender)
    }
  }, [])

  const sendMessage = React.useCallback((content: string) => {
    const trimmed = content.trim()
    if (!trimmed) return

    const patientMessage: AssistantMessage = {
      id: crypto.randomUUID(),
      sender: "patient",
      content: trimmed,
      createdAt: new Date().toISOString(),
    }
    messages = [...messages, patientMessage]
    notify()

    // TODO: swap for a real streaming call to POST /ai/chat
    window.setTimeout(() => {
      const reply: AssistantMessage = {
        id: crypto.randomUUID(),
        sender: "assistant",
        content: mockReply(trimmed),
        createdAt: new Date().toISOString(),
      }
      messages = [...messages, reply]
      notify()
    }, 500)
  }, [])

  return { messages, sendMessage }
}
