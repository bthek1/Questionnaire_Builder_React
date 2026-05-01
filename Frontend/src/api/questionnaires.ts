import { apiClient } from '@/lib/axios'
import type { Questionnaire } from '@/types'

export async function getQuestionnaires(): Promise<Questionnaire[]> {
  const { data } = await apiClient.get<Questionnaire[] | { results: Questionnaire[] }>(
    '/questionnaires/',
  )
  return Array.isArray(data) ? data : data.results
}

export async function getQuestionnaire(id: string): Promise<Questionnaire> {
  const { data } = await apiClient.get<Questionnaire>(`/questionnaires/${id}/`)
  return data
}

export async function getQuestionnaireByToken(shareToken: string): Promise<Questionnaire> {
  const { data } = await apiClient.get<Questionnaire>(`/questionnaires/by-token/${shareToken}/`)
  return data
}

export async function createQuestionnaire(payload: {
  questionnaireTypeId: string
  name?: string
}): Promise<Questionnaire> {
  const { data } = await apiClient.post<Questionnaire>('/questionnaires/', payload)
  return data
}

export async function updateQuestionnaire(
  id: string,
  payload: Partial<Pick<Questionnaire, 'name'>>,
): Promise<Questionnaire> {
  const { data } = await apiClient.patch<Questionnaire>(`/questionnaires/${id}/`, payload)
  return data
}

export async function deleteQuestionnaire(id: string): Promise<void> {
  await apiClient.delete(`/questionnaires/${id}/`)
}

export async function submitAnswers(
  shareToken: string,
  answers: Record<string, unknown>,
  metrics: Record<string, unknown> = {},
): Promise<Questionnaire> {
  const { data } = await apiClient.patch<Questionnaire>(
    `/questionnaires/by-token/${shareToken}/submit/`,
    { answers, metrics },
  )
  return data
}
