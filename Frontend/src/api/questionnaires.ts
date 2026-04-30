import { apiClient } from '@/lib/axios'
import type { Questionnaire } from '@/types'

export async function getQuestionnaires(): Promise<Questionnaire[]> {
  const { data } = await apiClient.get<Questionnaire[] | { results: Questionnaire[] }>(
    '/questionnaires',
  )
  return Array.isArray(data) ? data : data.results
}

export async function getQuestionnaire(id: string): Promise<Questionnaire> {
  const { data } = await apiClient.get<Questionnaire>(`/questionnaires/${id}`)
  return data
}

export async function createQuestionnaire(
  payload: Omit<Questionnaire, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Questionnaire> {
  const { data } = await apiClient.post<Questionnaire>('/questionnaires/', payload)
  return data
}

export async function updateQuestionnaire(
  id: string,
  payload: Partial<Omit<Questionnaire, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<Questionnaire> {
  const { data } = await apiClient.patch<Questionnaire>(`/questionnaires/${id}/`, payload)
  return data
}

export async function deleteQuestionnaire(id: string): Promise<void> {
  await apiClient.delete(`/questionnaires/${id}/`)
}
