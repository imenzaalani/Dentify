import { apiRequest } from "./client"
import type {
  Referral,
  ReferralCreateRequest,
  ReferralStatus,
  ReferralUpdateRequest,
} from "@/types/referral"

export const referralApi = {
  async listReferrals(): Promise<Referral[]> {
    return apiRequest<Referral[]>("/referrals/")
  },

  async getReferral(id: string): Promise<Referral> {
    return apiRequest<Referral>(`/referrals/${id}`)
  },

  async createReferral(payload: ReferralCreateRequest): Promise<Referral> {
    return apiRequest<Referral>("/referrals/", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  async updateReferral(id: string, payload: ReferralUpdateRequest): Promise<Referral> {
    return apiRequest<Referral>(`/referrals/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },

  async updateReferralStatus(id: string, statusValue: ReferralStatus): Promise<Referral> {
    return apiRequest<Referral>(`/referrals/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: statusValue }),
    })
  },
}
