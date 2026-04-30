import { vi, beforeEach } from 'vitest'
import type { QuestionnaireResponse } from '@/types'

vi.mock('@/lib/axios', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

import { apiClient } from '@/lib/axios'
import { submitResponse, getResponses } from '@/api/responses'

const mockGet = apiClient.get as ReturnType<typeof vi.fn>
const mockPost = apiClient.post as ReturnType<typeof vi.fn>

const mockResponse: QuestionnaireResponse = {
  id: 'r1',
  questionnaireId: 'q1',
  answers: { q1: 'yes' },
  submittedAt: '2024-01-02T00:00:00Z',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('submitResponse()', () => {
  it('posts answers and returns the created response', async () => {
    const answers = { question1: 'yes', question2: 'no' }
    mockPost.mockResolvedValueOnce({ data: mockResponse })
    const result = await submitResponse('q1', answers)
    expect(mockPost).toHaveBeenCalledWith('/questionnaires/q1/responses/', { answers })
    expect(result).toEqual(mockResponse)
  })
})

describe('getResponses()', () => {
  it('fetches responses for a questionnaire', async () => {
    mockGet.mockResolvedValueOnce({ data: [mockResponse] })
    const result = await getResponses('q1')
    expect(mockGet).toHaveBeenCalledWith('/questionnaires/q1/responses/')
    expect(result).toEqual([mockResponse])
  })

  it('returns empty array when no responses exist', async () => {
    mockGet.mockResolvedValueOnce({ data: [] })
    const result = await getResponses('q1')
    expect(result).toHaveLength(0)
  })
})
