import { vi, beforeEach } from 'vitest'
import type { Battery, BatteryType } from '@/types'

vi.mock('@/lib/axios', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

import { apiClient } from '@/lib/axios'
import {
  getBatteryTypes,
  getBatteryType,
  createBatteryType,
  updateBatteryType,
  deleteBatteryType,
} from '@/api/batteryTypes'
import {
  getBatteries,
  getBattery,
  createBattery,
  deleteBattery,
  getBatteryByToken,
} from '@/api/batteries'

const mockGet = apiClient.get as ReturnType<typeof vi.fn>
const mockPost = apiClient.post as ReturnType<typeof vi.fn>
const mockPatch = apiClient.patch as ReturnType<typeof vi.fn>
const mockDelete = apiClient.delete as ReturnType<typeof vi.fn>

const mockBatteryType: BatteryType = {
  id: 'bt1',
  title: 'My Battery Type',
  questionnaireTypeIds: ['qt1', 'qt2'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

const mockBattery: Battery = {
  id: 'b1',
  batteryTypeId: 'bt1',
  batteryTypeName: 'My Battery Type',
  name: 'Run A',
  shareToken: 'share-token-123',
  questionnaires: [
    {
      order: 0,
      questionnaireId: 'q1',
      shareToken: 'qt-token-1',
      questionnaireTypeName: 'Survey 1',
      submittedAt: null,
    },
    {
      order: 1,
      questionnaireId: 'q2',
      shareToken: 'qt-token-2',
      questionnaireTypeName: 'Survey 2',
      submittedAt: null,
    },
  ],
  isComplete: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ── BatteryType API ──────────────────────────────────────────────────────────

describe('getBatteryTypes()', () => {
  it('returns array when API responds with array', async () => {
    mockGet.mockResolvedValueOnce({ data: [mockBatteryType] })
    const result = await getBatteryTypes()
    expect(mockGet).toHaveBeenCalledWith('/battery-types/')
    expect(result).toEqual([mockBatteryType])
  })

  it('returns results array when paginated', async () => {
    mockGet.mockResolvedValueOnce({ data: { results: [mockBatteryType] } })
    const result = await getBatteryTypes()
    expect(result).toEqual([mockBatteryType])
  })
})

describe('getBatteryType()', () => {
  it('fetches single battery type', async () => {
    mockGet.mockResolvedValueOnce({ data: mockBatteryType })
    const result = await getBatteryType('bt1')
    expect(mockGet).toHaveBeenCalledWith('/battery-types/bt1/')
    expect(result).toEqual(mockBatteryType)
  })
})

describe('createBatteryType()', () => {
  it('posts and returns created battery type', async () => {
    const payload = { title: 'New BT', questionnaireTypeIds: ['qt1'] }
    mockPost.mockResolvedValueOnce({ data: mockBatteryType })
    const result = await createBatteryType(payload)
    expect(mockPost).toHaveBeenCalledWith('/battery-types/', payload)
    expect(result).toEqual(mockBatteryType)
  })
})

describe('updateBatteryType()', () => {
  it('patches battery type', async () => {
    mockPatch.mockResolvedValueOnce({ data: mockBatteryType })
    const result = await updateBatteryType('bt1', { title: 'Updated' })
    expect(mockPatch).toHaveBeenCalledWith('/battery-types/bt1/', { title: 'Updated' })
    expect(result).toEqual(mockBatteryType)
  })
})

describe('deleteBatteryType()', () => {
  it('sends DELETE request', async () => {
    mockDelete.mockResolvedValueOnce({})
    await deleteBatteryType('bt1')
    expect(mockDelete).toHaveBeenCalledWith('/battery-types/bt1/')
  })
})

// ── Battery API ───────────────────────────────────────────────────────────────

describe('getBatteries()', () => {
  it('returns array', async () => {
    mockGet.mockResolvedValueOnce({ data: [mockBattery] })
    const result = await getBatteries()
    expect(mockGet).toHaveBeenCalledWith('/batteries/')
    expect(result).toEqual([mockBattery])
  })

  it('returns results array when paginated', async () => {
    mockGet.mockResolvedValueOnce({ data: { results: [mockBattery] } })
    const result = await getBatteries()
    expect(result).toEqual([mockBattery])
  })
})

describe('getBattery()', () => {
  it('fetches single battery', async () => {
    mockGet.mockResolvedValueOnce({ data: mockBattery })
    const result = await getBattery('b1')
    expect(mockGet).toHaveBeenCalledWith('/batteries/b1/')
    expect(result).toEqual(mockBattery)
  })
})

describe('createBattery()', () => {
  it('posts and returns battery', async () => {
    const payload = { battery_type: 'bt1', name: 'Run A' }
    mockPost.mockResolvedValueOnce({ data: mockBattery })
    const result = await createBattery(payload)
    expect(mockPost).toHaveBeenCalledWith('/batteries/', payload)
    expect(result).toEqual(mockBattery)
  })
})

describe('deleteBattery()', () => {
  it('sends DELETE request', async () => {
    mockDelete.mockResolvedValueOnce({})
    await deleteBattery('b1')
    expect(mockDelete).toHaveBeenCalledWith('/batteries/b1/')
  })
})

describe('getBatteryByToken()', () => {
  it('fetches battery by share token', async () => {
    mockGet.mockResolvedValueOnce({ data: mockBattery })
    const result = await getBatteryByToken('share-token-123')
    expect(mockGet).toHaveBeenCalledWith('/batteries/by-token/share-token-123/')
    expect(result).toEqual(mockBattery)
  })
})
