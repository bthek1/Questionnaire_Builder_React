import { apiClient } from '@/lib/axios'
import type { QuestionnaireType } from '@/types'

export async function getQuestionnaireTypes(): Promise<QuestionnaireType[]> {
  const { data } = await apiClient.get<QuestionnaireType[] | { results: QuestionnaireType[] }>(
    '/questionnaire-types/',
  )
  return Array.isArray(data) ? data : data.results
}

export async function getQuestionnaireType(id: string): Promise<QuestionnaireType> {
  const { data } = await apiClient.get<QuestionnaireType>(`/questionnaire-types/${id}/`)
  return data
}

export async function createQuestionnaireType(
  payload: Omit<QuestionnaireType, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<QuestionnaireType> {
  const { data } = await apiClient.post<QuestionnaireType>('/questionnaire-types/', payload)
  return data
}

export async function updateQuestionnaireType(
  id: string,
  payload: Partial<Omit<QuestionnaireType, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<QuestionnaireType> {
  const { data } = await apiClient.patch<QuestionnaireType>(`/questionnaire-types/${id}/`, payload)
  return data
}

export async function deleteQuestionnaireType(id: string): Promise<void> {
  await apiClient.delete(`/questionnaire-types/${id}/`)
}
