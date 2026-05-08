import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getBatteryTypes,
  getBatteryType,
  createBatteryType,
  updateBatteryType,
  deleteBatteryType,
} from '@/api/batteryTypes'
import type { BatteryType } from '@/types'

export const batteryTypeKeys = {
  all: ['battery-types'] as const,
  detail: (id: string) => ['battery-types', id] as const,
}

export function useBatteryTypes() {
  return useQuery({
    queryKey: batteryTypeKeys.all,
    queryFn: getBatteryTypes,
  })
}

export function useBatteryType(id: string) {
  return useQuery({
    queryKey: batteryTypeKeys.detail(id),
    queryFn: () => getBatteryType(id),
    enabled: !!id,
  })
}

export function useCreateBatteryType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createBatteryType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: batteryTypeKeys.all })
    },
  })
}

export function useUpdateBatteryType(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (
      payload: Partial<Pick<BatteryType, 'title' | 'description' | 'questionnaireTypeIds'>>,
    ) => updateBatteryType(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: batteryTypeKeys.all })
      queryClient.invalidateQueries({ queryKey: batteryTypeKeys.detail(id) })
    },
  })
}

export function useDeleteBatteryType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteBatteryType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: batteryTypeKeys.all })
    },
  })
}
