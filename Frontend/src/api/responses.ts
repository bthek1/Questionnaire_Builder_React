import { apiClient } from '@/lib/axios'
import type { Questionnaire } from '@/types'

export async function submitResponse(
  questionnaireId: string,
  answers: object,
): Promise<Questionnaire> {
  const { data } = await apiClient.post<Questionnaire>(
    `/questionnaires/${questionnaireId}/responses/`,
    { answers },
  )
  return data
}

export async function getResponses(questionnaireId: string): Promise<Questionnaire[]> {
  const { data } = await apiClient.get<Questionnaire[]>(
    `/questionnaires/${questionnaireId}/responses/`,
  )
  return data
}
