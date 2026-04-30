import { apiClient } from '@/lib/axios'
import type { QuestionnaireResponse, Answer } from '@/types'

export async function submitResponse(
  questionnaireId: string,
  answers: Answer[],
): Promise<QuestionnaireResponse> {
  const { data } = await apiClient.post<QuestionnaireResponse>(
    `/questionnaires/${questionnaireId}/responses`,
    { answers },
  )
  return data
}

export async function getResponses(questionnaireId: string): Promise<QuestionnaireResponse[]> {
  const { data } = await apiClient.get<QuestionnaireResponse[]>(
    `/questionnaires/${questionnaireId}/responses`,
  )
  return data
}
