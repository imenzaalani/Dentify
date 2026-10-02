"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { authApi } from "@/lib/api"
import type { User } from "@/types/auth"

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string, portal?: "patient" | "staff", rememberMe?: boolean) => Promise<User>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    // No client-readable token to check anymore — the httpOnly cookie (if
    // any) rides along automatically, and the proxy/backend tell us via the
    // response whether there's a valid session.
    try {
      const me = await authApi.me()
      setUser(me)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = useCallback(async (email: string, password: string, portal?: "patient" | "staff", rememberMe?: boolean) => {
    const me = await authApi.login(email, password, portal, rememberMe)
    setUser(me)
    return me
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}