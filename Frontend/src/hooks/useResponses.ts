import { useQuery, useMutation } from '@tanstack/react-query'
import { submitResponse, getResponses } from '@/api/responses'

export const responseKeys = {
  all: (questionnaireId: string) => ['responses', questionnaireId] as const,
}

export function useSubmitResponse(questionnaireId: string) {
  return useMutation({
    mutationFn: (data: object) => submitResponse(questionnaireId, data),
  })
}

export function useResponses(questionnaireId: string) {
  return useQuery({
    queryKey: responseKeys.all(questionnaireId),
    queryFn: () => getResponses(questionnaireId),
    enabled: !!questionnaireId,
  })
}
