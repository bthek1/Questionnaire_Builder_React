import { vi, beforeEach } from 'vitest'
import type { Questionnaire } from '@/types'

// Mock the axios client so no real HTTP requests are made
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
  getQuestionnaires,
  getQuestionnaire,
  createQuestionnaire,
  updateQuestionnaire,
  deleteQuestionnaire,
} from '@/api/questionnaires'

const mockGet = apiClient.get as ReturnType<typeof vi.fn>
const mockPost = apiClient.post as ReturnType<typeof vi.fn>
const mockPatch = apiClient.patch as ReturnType<typeof vi.fn>
const mockDelete = apiClient.delete as ReturnType<typeof vi.fn>

const mockQuestionnaire: Questionnaire = {
  id: '1',
  title: 'Test Survey',
  description: 'A description',
  surveyJson: { pages: [] },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getQuestionnaires()', () => {
  it('returns array when API responds with an array', async () => {
    mockGet.mockResolvedValueOnce({ data: [mockQuestionnaire] })
    const result = await getQuestionnaires()
    expect(mockGet).toHaveBeenCalledWith('/questionnaires')
    expect(result).toEqual([mockQuestionnaire])
  })

  it('returns results array when API responds with paginated object', async () => {
    mockGet.mockResolvedValueOnce({ data: { results: [mockQuestionnaire] } })
    const result = await getQuestionnaires()
    expect(result).toEqual([mockQuestionnaire])
  })
})

describe('getQuestionnaire()', () => {
  it('returns a single questionnaire by id', async () => {
    mockGet.mockResolvedValueOnce({ data: mockQuestionnaire })
    const result = await getQuestionnaire('1')
    expect(mockGet).toHaveBeenCalledWith('/questionnaires/1')
    expect(result).toEqual(mockQuestionnaire)
  })
})

describe('createQuestionnaire()', () => {
  it('posts payload and returns created questionnaire', async () => {
    const payload = { title: 'New Survey', description: 'Desc' }
    mockPost.mockResolvedValueOnce({ data: { ...mockQuestionnaire, ...payload } })
    const result = await createQuestionnaire(payload)
    expect(mockPost).toHaveBeenCalledWith('/questionnaires', payload)
    expect(result.title).toBe('New Survey')
  })
})

describe('updateQuestionnaire()', () => {
  it('patches the questionnaire and returns the updated record', async () => {
    const patch = { title: 'Updated' }
    mockPatch.mockResolvedValueOnce({ data: { ...mockQuestionnaire, title: 'Updated' } })
    const result = await updateQuestionnaire('1', patch)
    expect(mockPatch).toHaveBeenCalledWith('/questionnaires/1', patch)
    expect(result.title).toBe('Updated')
  })
})

describe('deleteQuestionnaire()', () => {
  it('calls delete endpoint with correct id', async () => {
    mockDelete.mockResolvedValueOnce({})
    await deleteQuestionnaire('1')
    expect(mockDelete).toHaveBeenCalledWith('/questionnaires/1')
  })
})
