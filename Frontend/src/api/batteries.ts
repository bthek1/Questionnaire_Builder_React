import { apiClient } from '@/lib/axios'
import type { Battery } from '@/types'

export async function getBatteries(): Promise<Battery[]> {
  const { data } = await apiClient.get<Battery[] | { results: Battery[] }>('/batteries/')
  return Array.isArray(data) ? data : data.results
}

export async function getBattery(id: string): Promise<Battery> {
  const { data } = await apiClient.get<Battery>(`/batteries/${id}/`)
  return data
}

export async function createBattery(payload: {
  battery_type: string
  name?: string
}): Promise<Battery> {
  const { data } = await apiClient.post<Battery>('/batteries/', payload)
  return data
}

export async function deleteBattery(id: string): Promise<void> {
  await apiClient.delete(`/batteries/${id}/`)
}

export async function getBatteryByToken(shareToken: string): Promise<Battery> {
  const { data } = await apiClient.get<Battery>(`/batteries/by-token/${shareToken}/`)
  return data
}
