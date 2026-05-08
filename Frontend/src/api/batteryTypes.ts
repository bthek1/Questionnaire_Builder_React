import { apiClient } from '@/lib/axios'
import type { BatteryType } from '@/types'

export async function getBatteryTypes(): Promise<BatteryType[]> {
  const { data } = await apiClient.get<BatteryType[] | { results: BatteryType[] }>(
    '/battery-types/',
  )
  return Array.isArray(data) ? data : data.results
}

export async function getBatteryType(id: string): Promise<BatteryType> {
  const { data } = await apiClient.get<BatteryType>(`/battery-types/${id}/`)
  return data
}

export async function createBatteryType(payload: {
  title: string
  description?: string
  questionnaireTypeIds?: string[]
}): Promise<BatteryType> {
  const { data } = await apiClient.post<BatteryType>('/battery-types/', payload)
  return data
}

export async function updateBatteryType(
  id: string,
  payload: Partial<Pick<BatteryType, 'title' | 'description' | 'questionnaireTypeIds'>>,
): Promise<BatteryType> {
  const { data } = await apiClient.patch<BatteryType>(`/battery-types/${id}/`, payload)
  return data
}

export async function deleteBatteryType(id: string): Promise<void> {
  await apiClient.delete(`/battery-types/${id}/`)
}
