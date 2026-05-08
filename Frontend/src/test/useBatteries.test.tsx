import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import type { Battery, BatteryType } from '@/types'

vi.mock('@/api/batteryTypes', () => ({
  getBatteryTypes: vi.fn(),
  getBatteryType: vi.fn(),
  createBatteryType: vi.fn(),
  updateBatteryType: vi.fn(),
  deleteBatteryType: vi.fn(),
}))

vi.mock('@/api/batteries', () => ({
  getBatteries: vi.fn(),
  getBattery: vi.fn(),
  createBattery: vi.fn(),
  deleteBattery: vi.fn(),
  getBatteryByToken: vi.fn(),
}))

import {
  getBatteryTypes,
  getBatteryType,
  createBatteryType,
  deleteBatteryType,
} from '@/api/batteryTypes'
import {
  getBatteries,
  getBattery,
  createBattery,
  deleteBattery,
  getBatteryByToken,
} from '@/api/batteries'
import {
  useBatteryTypes,
  useBatteryType,
  useCreateBatteryType,
  useDeleteBatteryType,
  batteryTypeKeys,
} from '@/hooks/useBatteryTypes'
import {
  useBatteries,
  useBattery,
  useBatteryByToken,
  useCreateBattery,
  useDeleteBattery,
  batteryKeys,
} from '@/hooks/useBatteries'

const mockGetBatteryTypes = getBatteryTypes as ReturnType<typeof vi.fn>
const mockGetBatteryType = getBatteryType as ReturnType<typeof vi.fn>
const mockCreateBatteryType = createBatteryType as ReturnType<typeof vi.fn>
const mockDeleteBatteryType = deleteBatteryType as ReturnType<typeof vi.fn>

const mockGetBatteries = getBatteries as ReturnType<typeof vi.fn>
const mockGetBattery = getBattery as ReturnType<typeof vi.fn>
const mockCreateBattery = createBattery as ReturnType<typeof vi.fn>
const mockDeleteBattery = deleteBattery as ReturnType<typeof vi.fn>
const mockGetBatteryByToken = getBatteryByToken as ReturnType<typeof vi.fn>

const sampleBatteryType: BatteryType = {
  id: 'bt1',
  title: 'Battery Type One',
  questionnaireTypeIds: ['qt1'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

const sampleBattery: Battery = {
  id: 'b1',
  batteryTypeId: 'bt1',
  batteryTypeName: 'Battery Type One',
  name: 'Run A',
  shareToken: 'share-token-xyz',
  questionnaires: [],
  isComplete: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ── BatteryType Keys ─────────────────────────────────────────────────────────

describe('batteryTypeKeys', () => {
  it('all key is stable', () => {
    expect(batteryTypeKeys.all).toEqual(['battery-types'])
  })

  it('detail key includes id', () => {
    expect(batteryTypeKeys.detail('bt1')).toEqual(['battery-types', 'bt1'])
  })
})

// ── Battery Keys ─────────────────────────────────────────────────────────────

describe('batteryKeys', () => {
  it('all key is stable', () => {
    expect(batteryKeys.all).toEqual(['batteries'])
  })

  it('detail key includes id', () => {
    expect(batteryKeys.detail('b1')).toEqual(['batteries', 'b1'])
  })

  it('byToken key includes token', () => {
    expect(batteryKeys.byToken('tok')).toEqual(['batteries', 'token', 'tok'])
  })
})

// ── useBatteryTypes ───────────────────────────────────────────────────────────

describe('useBatteryTypes()', () => {
  it('returns list on success', async () => {
    mockGetBatteryTypes.mockResolvedValueOnce([sampleBatteryType])
    const { result } = renderHook(() => useBatteryTypes(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([sampleBatteryType])
  })

  it('sets isError on failure', async () => {
    mockGetBatteryTypes.mockRejectedValueOnce(new Error('fail'))
    const { result } = renderHook(() => useBatteryTypes(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useBatteryType()', () => {
  it('fetches by id', async () => {
    mockGetBatteryType.mockResolvedValueOnce(sampleBatteryType)
    const { result } = renderHook(() => useBatteryType('bt1'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(sampleBatteryType)
  })
})

describe('useCreateBatteryType()', () => {
  it('calls createBatteryType on mutate', async () => {
    mockCreateBatteryType.mockResolvedValueOnce(sampleBatteryType)
    mockGetBatteryTypes.mockResolvedValue([])
    const { result } = renderHook(() => useCreateBatteryType(), { wrapper: makeWrapper() })
    await act(async () => {
      result.current.mutate({ title: 'New BT' })
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockCreateBatteryType).toHaveBeenCalledWith({ title: 'New BT' }, expect.any(Object))
  })
})

describe('useDeleteBatteryType()', () => {
  it('calls deleteBatteryType on mutate', async () => {
    mockDeleteBatteryType.mockResolvedValueOnce(undefined)
    mockGetBatteryTypes.mockResolvedValue([])
    const { result } = renderHook(() => useDeleteBatteryType(), { wrapper: makeWrapper() })
    await act(async () => {
      result.current.mutate('bt1')
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockDeleteBatteryType).toHaveBeenCalledWith('bt1', expect.any(Object))
  })
})

// ── useBatteries ──────────────────────────────────────────────────────────────

describe('useBatteries()', () => {
  it('returns list on success', async () => {
    mockGetBatteries.mockResolvedValueOnce([sampleBattery])
    const { result } = renderHook(() => useBatteries(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([sampleBattery])
  })
})

describe('useBattery()', () => {
  it('fetches by id', async () => {
    mockGetBattery.mockResolvedValueOnce(sampleBattery)
    const { result } = renderHook(() => useBattery('b1'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(sampleBattery)
  })
})

describe('useBatteryByToken()', () => {
  it('fetches by share token', async () => {
    mockGetBatteryByToken.mockResolvedValueOnce(sampleBattery)
    const { result } = renderHook(() => useBatteryByToken('share-token-xyz'), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(sampleBattery)
  })

  it('is disabled when token is empty', () => {
    const { result } = renderHook(() => useBatteryByToken(''), { wrapper: makeWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useCreateBattery()', () => {
  it('calls createBattery on mutate', async () => {
    mockCreateBattery.mockResolvedValueOnce(sampleBattery)
    mockGetBatteries.mockResolvedValue([])
    const { result } = renderHook(() => useCreateBattery(), { wrapper: makeWrapper() })
    await act(async () => {
      result.current.mutate({ battery_type: 'bt1', name: 'Run A' })
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockCreateBattery).toHaveBeenCalledWith(
      { battery_type: 'bt1', name: 'Run A' },
      expect.any(Object),
    )
  })
})

describe('useDeleteBattery()', () => {
  it('calls deleteBattery on mutate', async () => {
    mockDeleteBattery.mockResolvedValueOnce(undefined)
    mockGetBatteries.mockResolvedValue([])
    const { result } = renderHook(() => useDeleteBattery(), { wrapper: makeWrapper() })
    await act(async () => {
      result.current.mutate('b1')
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockDeleteBattery).toHaveBeenCalledWith('b1', expect.any(Object))
  })
})
