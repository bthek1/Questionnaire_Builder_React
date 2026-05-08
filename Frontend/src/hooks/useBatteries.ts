import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getBatteries,
  getBattery,
  createBattery,
  deleteBattery,
  getBatteryByToken,
} from '@/api/batteries'

export const batteryKeys = {
  all: ['batteries'] as const,
  detail: (id: string) => ['batteries', id] as const,
  byToken: (token: string) => ['batteries', 'token', token] as const,
}

export function useBatteries() {
  return useQuery({
    queryKey: batteryKeys.all,
    queryFn: getBatteries,
  })
}

export function useBattery(id: string) {
  return useQuery({
    queryKey: batteryKeys.detail(id),
    queryFn: () => getBattery(id),
    enabled: !!id,
  })
}

export function useBatteryByToken(shareToken: string) {
  return useQuery({
    queryKey: batteryKeys.byToken(shareToken),
    queryFn: () => getBatteryByToken(shareToken),
    enabled: !!shareToken,
  })
}

export function useCreateBattery() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createBattery,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: batteryKeys.all })
    },
  })
}

export function useDeleteBattery() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteBattery,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: batteryKeys.all })
    },
  })
}
