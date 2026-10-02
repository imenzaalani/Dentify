import { apiRequest, ApiError } from "./client"
import type {
  StaffCreatePayload,
  StaffMember,
  StaffUpdatePayload,
  User,
} from "@/types/auth"

export const authApi = {
  async login(email: string, password: string, portal?: "patient" | "staff", rememberMe?: boolean): Promise<User> {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, portal, rememberMe }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new ApiError(res.status, body.detail ?? res.statusText)
    }

    return authApi.me()
  },

  async me(): Promise<User> {
    return apiRequest<User>("/auth/me")
  },

  updateMe(payload: { email?: string | null; first_name?: string | null; last_name?: string | null; phone?: string | null }): Promise<User> {
    return apiRequest<User>("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },

  changePassword(currentPassword: string, newPassword: string): Promise<{ detail: string }> {
    return apiRequest<{ detail: string }>("/auth/me/change-password", {
      method: "POST",
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    })
  },

  async logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
    } catch {
      // Best-effort — the route clears cookies server-side regardless of
      // whether the browser considers this fetch to have "succeeded"; a
      // network failure here shouldn't block the UI from treating the user
      // as logged out.
    }
  },

  forgotPassword(email: string, portal?: "patient" | "staff"): Promise<{ detail: string }> {
    return apiRequest("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email, portal }),
    })
  },

  resetPassword(token: string, newPassword: string): Promise<{ detail: string }> {
    return apiRequest("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, new_password: newPassword }),
    })
  },

  staff: {
    list(role?: string): Promise<StaffMember[]> {
      const query = role ? `?role=${encodeURIComponent(role)}` : ""
      return apiRequest<StaffMember[]>(`/auth/staff${query}`)
    },

    get(id: string): Promise<StaffMember> {
      return apiRequest<StaffMember>(`/auth/staff/${id}`)
    },

    create(payload: StaffCreatePayload): Promise<StaffMember> {
      return apiRequest<StaffMember>("/auth/staff", {
        method: "POST",
        body: JSON.stringify(payload),
      })
    },

    update(id: string, payload: StaffUpdatePayload): Promise<StaffMember> {
      return apiRequest<StaffMember>(`/auth/staff/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })
    },

    resendInvite(id: string): Promise<StaffMember> {
      return apiRequest<StaffMember>(`/auth/staff/${id}/resend-invite`, {
        method: "POST",
      })
    },

    uploadAvatar(id: string, file: File): Promise<StaffMember> {
      const formData = new FormData()
      formData.append("file", file)
      return apiRequest<StaffMember>(`/auth/staff/${id}/avatar`, {
        method: "POST",
        body: formData,
      })
    },

    uploadMyAvatar(file: File): Promise<User> {
      const formData = new FormData()
      formData.append("file", file)
      return apiRequest<User>(`/auth/me/avatar`, {
        method: "POST",
        body: formData,
      })
    },

    toggleStatus(id: string): Promise<StaffMember> {
      return apiRequest<StaffMember>(`/auth/staff/${id}/toggle-status`, {
        method: "POST",
      })
    },

    delete(id: string): Promise<void> {
      return apiRequest<void>(`/auth/staff/${id}`, {
        method: "DELETE",
      })
    },
  },
}