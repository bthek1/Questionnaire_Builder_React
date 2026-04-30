import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getQuestionnaires,
  getQuestionnaire,
  createQuestionnaire,
  updateQuestionnaire,
  deleteQuestionnaire,
} from '@/api/questionnaires'
import type { Questionnaire } from '@/types'

export const questionnaireKeys = {
  all: ['questionnaires'] as const,
  detail: (id: string) => ['questionnaires', id] as const,
}

export function useQuestionnaires() {
  return useQuery({
    queryKey: questionnaireKeys.all,
    queryFn: getQuestionnaires,
  })
}

export function useQuestionnaire(id: string) {
  return useQuery({
    queryKey: questionnaireKeys.detail(id),
    queryFn: () => getQuestionnaire(id),
    enabled: !!id,
  })
}

export function useCreateQuestionnaire() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createQuestionnaire,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionnaireKeys.all })
    },
  })
}

export function useUpdateQuestionnaire(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<Omit<Questionnaire, 'id' | 'createdAt' | 'updatedAt'>>) =>
      updateQuestionnaire(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionnaireKeys.all })
      queryClient.invalidateQueries({ queryKey: questionnaireKeys.detail(id) })
    },
  })
}

export function useDeleteQuestionnaire() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteQuestionnaire,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionnaireKeys.all })
    },
  })
}
