import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getQuestionnaireTypes,
  getQuestionnaireType,
  createQuestionnaireType,
  updateQuestionnaireType,
  deleteQuestionnaireType,
} from '@/api/questionnaireTypes'
import type { QuestionnaireType } from '@/types'

export const questionnaireTypeKeys = {
  all: ['questionnaire-types'] as const,
  detail: (id: string) => ['questionnaire-types', id] as const,
}

export function useQuestionnaireTypes() {
  return useQuery({
    queryKey: questionnaireTypeKeys.all,
    queryFn: getQuestionnaireTypes,
  })
}

export function useQuestionnaireType(id: string) {
  return useQuery({
    queryKey: questionnaireTypeKeys.detail(id),
    queryFn: () => getQuestionnaireType(id),
    enabled: !!id,
  })
}

export function useCreateQuestionnaireType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createQuestionnaireType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionnaireTypeKeys.all })
    },
  })
}

export function useUpdateQuestionnaireType(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<Omit<QuestionnaireType, 'id' | 'createdAt' | 'updatedAt'>>) =>
      updateQuestionnaireType(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionnaireTypeKeys.all })
      queryClient.invalidateQueries({ queryKey: questionnaireTypeKeys.detail(id) })
    },
  })
}

export function useDeleteQuestionnaireType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteQuestionnaireType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionnaireTypeKeys.all })
    },
  })
}
