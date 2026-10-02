export type ResourceType = "chair" | "room"

export interface Resource {
  id: string
  name: string
  type: ResourceType
  active: boolean
  created_at: string
  updated_at: string
}

export interface ResourceCreateRequest {
  name: string
  type: ResourceType
}

export interface ResourceUpdateRequest {
  name?: string
  type?: ResourceType
  active?: boolean
}