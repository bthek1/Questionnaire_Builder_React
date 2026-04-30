import { vi, beforeEach } from 'vitest'
import type { QuestionnaireType } from '@/types'

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
  getQuestionnaireTypes,
  getQuestionnaireType,
  createQuestionnaireType,
  updateQuestionnaireType,
  deleteQuestionnaireType,
} from '@/api/questionnaireTypes'

const mockGet = apiClient.get as ReturnType<typeof vi.fn>
const mockPost = apiClient.post as ReturnType<typeof vi.fn>
const mockPatch = apiClient.patch as ReturnType<typeof vi.fn>
const mockDelete = apiClient.delete as ReturnType<typeof vi.fn>

const mockType: QuestionnaireType = {
  id: 'qt1',
  title: 'Test Survey',
  surveyJson: { pages: [] },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getQuestionnaireTypes()', () => {
  it('returns array from list endpoint', async () => {
    mockGet.mockResolvedValueOnce({ data: [mockType] })
    const result = await getQuestionnaireTypes()
    expect(mockGet).toHaveBeenCalledWith('/questionnaire-types/')
    expect(result).toEqual([mockType])
  })

  it('unwraps paginated results', async () => {
    mockGet.mockResolvedValueOnce({ data: { results: [mockType] } })
    const result = await getQuestionnaireTypes()
    expect(result).toEqual([mockType])
  })
})

describe('getQuestionnaireType()', () => {
  it('fetches a single type by id', async () => {
    mockGet.mockResolvedValueOnce({ data: mockType })
    const result = await getQuestionnaireType('qt1')
    expect(mockGet).toHaveBeenCalledWith('/questionnaire-types/qt1/')
    expect(result).toEqual(mockType)
  })
})

describe('createQuestionnaireType()', () => {
  it('posts payload and returns the new type', async () => {
    mockPost.mockResolvedValueOnce({ data: mockType })
    const result = await createQuestionnaireType({ title: 'Test Survey' })
    expect(mockPost).toHaveBeenCalledWith('/questionnaire-types/', { title: 'Test Survey' })
    expect(result).toEqual(mockType)
  })
})

describe('updateQuestionnaireType()', () => {
  it('patches the type and returns updated record', async () => {
    mockPatch.mockResolvedValueOnce({ data: { ...mockType, title: 'Updated' } })
    const result = await updateQuestionnaireType('qt1', { title: 'Updated' })
    expect(mockPatch).toHaveBeenCalledWith('/questionnaire-types/qt1/', { title: 'Updated' })
    expect(result.title).toBe('Updated')
  })
})

describe('deleteQuestionnaireType()', () => {
  it('calls delete endpoint with correct id', async () => {
    mockDelete.mockResolvedValueOnce({})
    await deleteQuestionnaireType('qt1')
    expect(mockDelete).toHaveBeenCalledWith('/questionnaire-types/qt1/')
  })
})

