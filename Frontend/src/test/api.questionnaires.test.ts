import { vi, beforeEach } from 'vitest'
import type { Questionnaire } from '@/types'

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
  getQuestionnaireByToken,
  createQuestionnaire,
  updateQuestionnaire,
  deleteQuestionnaire,
  submitAnswers,
} from '@/api/questionnaires'

const mockGet = apiClient.get as ReturnType<typeof vi.fn>
const mockPost = apiClient.post as ReturnType<typeof vi.fn>
const mockPatch = apiClient.patch as ReturnType<typeof vi.fn>
const mockDelete = apiClient.delete as ReturnType<typeof vi.fn>

const mockInstance: Questionnaire = {
  id: '1',
  questionnaireTypeId: 'qt1',
  name: 'Test Deployment',
  shareToken: 'token-abc',
  answers: {},
  submittedAt: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getQuestionnaires()', () => {
  it('returns array when API responds with an array', async () => {
    mockGet.mockResolvedValueOnce({ data: [mockInstance] })
    const result = await getQuestionnaires()
    expect(mockGet).toHaveBeenCalledWith('/questionnaires/')
    expect(result).toEqual([mockInstance])
  })

  it('returns results array when API responds with paginated object', async () => {
    mockGet.mockResolvedValueOnce({ data: { results: [mockInstance] } })
    const result = await getQuestionnaires()
    expect(result).toEqual([mockInstance])
  })
})

describe('getQuestionnaire()', () => {
  it('returns a single instance by id', async () => {
    mockGet.mockResolvedValueOnce({ data: mockInstance })
    const result = await getQuestionnaire('1')
    expect(mockGet).toHaveBeenCalledWith('/questionnaires/1/')
    expect(result).toEqual(mockInstance)
  })
})

describe('getQuestionnaireByToken()', () => {
  it('fetches by share token', async () => {
    mockGet.mockResolvedValueOnce({ data: mockInstance })
    const result = await getQuestionnaireByToken('token-abc')
    expect(mockGet).toHaveBeenCalledWith('/questionnaires/by-token/token-abc/')
    expect(result).toEqual(mockInstance)
  })
})

describe('createQuestionnaire()', () => {
  it('posts payload and returns created instance', async () => {
    const payload = { questionnaireTypeId: 'qt1', name: 'New' }
    mockPost.mockResolvedValueOnce({ data: mockInstance })
    const result = await createQuestionnaire(payload)
    expect(mockPost).toHaveBeenCalledWith('/questionnaires/', payload)
    expect(result).toEqual(mockInstance)
  })
})

describe('updateQuestionnaire()', () => {
  it('patches instance and returns updated record', async () => {
    const patch = { name: 'Updated' }
    mockPatch.mockResolvedValueOnce({ data: { ...mockInstance, name: 'Updated' } })
    const result = await updateQuestionnaire('1', patch)
    expect(mockPatch).toHaveBeenCalledWith('/questionnaires/1/', patch)
    expect(result.name).toBe('Updated')
  })
})

describe('deleteQuestionnaire()', () => {
  it('calls delete endpoint with correct id', async () => {
    mockDelete.mockResolvedValueOnce({})
    await deleteQuestionnaire('1')
    expect(mockDelete).toHaveBeenCalledWith('/questionnaires/1/')
  })
})

describe('submitAnswers()', () => {
  it('patches by-token submit and returns updated instance', async () => {
    const answers = { q1: 'yes' }
    const submitted = { ...mockInstance, answers, submittedAt: '2024-01-02T00:00:00Z' }
    mockPatch.mockResolvedValueOnce({ data: submitted })
    const result = await submitAnswers('token-abc', answers)
    expect(mockPatch).toHaveBeenCalledWith('/questionnaires/by-token/token-abc/submit/', { answers })
    expect(result).toEqual(submitted)
  })
})

