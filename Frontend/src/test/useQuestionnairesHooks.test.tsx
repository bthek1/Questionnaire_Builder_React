import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import type { Questionnaire } from '@/types'

vi.mock('@/api/questionnaires', () => ({
  getQuestionnaires: vi.fn(),
  getQuestionnaire: vi.fn(),
  getQuestionnaireByToken: vi.fn(),
  createQuestionnaire: vi.fn(),
  updateQuestionnaire: vi.fn(),
  deleteQuestionnaire: vi.fn(),
  submitAnswers: vi.fn(),
}))

import {
  getQuestionnaires,
  getQuestionnaire,
  getQuestionnaireByToken,
  createQuestionnaire,
  updateQuestionnaire,
  deleteQuestionnaire,
  submitAnswers,
} from '@/api/questionnaires'
import {
  useQuestionnaires,
  useQuestionnaire,
  useQuestionnaireByToken,
  useCreateQuestionnaire,
  useDeleteQuestionnaire,
  useSubmitAnswers,
  useUpdateQuestionnaire,
  questionnaireKeys,
} from '@/hooks/useQuestionnaires'

const mockGetQuestionnaires = getQuestionnaires as ReturnType<typeof vi.fn>
const mockGetQuestionnaire = getQuestionnaire as ReturnType<typeof vi.fn>
const mockGetQuestionnaireByToken = getQuestionnaireByToken as ReturnType<typeof vi.fn>
const mockCreateQuestionnaire = createQuestionnaire as ReturnType<typeof vi.fn>
const mockUpdateQuestionnaire = updateQuestionnaire as ReturnType<typeof vi.fn>
const mockDeleteQuestionnaire = deleteQuestionnaire as ReturnType<typeof vi.fn>
const mockSubmitAnswers = submitAnswers as ReturnType<typeof vi.fn>

const sampleInstance: Questionnaire = {
  id: '1',
  questionnaireTypeId: 'qt1',
  name: 'Test Run',
  shareToken: 'token-abc',
  answers: {},
  submittedAt: null,
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

describe('questionnaireKeys', () => {
  it('all key is stable', () => {
    expect(questionnaireKeys.all).toEqual(['questionnaires'])
  })

  it('detail key includes id', () => {
    expect(questionnaireKeys.detail('abc')).toEqual(['questionnaires', 'abc'])
  })

  it('byToken key includes token', () => {
    expect(questionnaireKeys.byToken('tok-1')).toEqual(['questionnaires', 'token', 'tok-1'])
  })
})

describe('useQuestionnaires()', () => {
  it('returns list of instances on success', async () => {
    mockGetQuestionnaires.mockResolvedValueOnce([sampleInstance])
    const { result } = renderHook(() => useQuestionnaires(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([sampleInstance])
  })

  it('sets isError on failure', async () => {
    mockGetQuestionnaires.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useQuestionnaires(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useQuestionnaire()', () => {
  it('fetches a single instance by id', async () => {
    mockGetQuestionnaire.mockResolvedValueOnce(sampleInstance)
    const { result } = renderHook(() => useQuestionnaire('1'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(sampleInstance)
    expect(mockGetQuestionnaire).toHaveBeenCalledWith('1')
  })

  it('does not fetch when id is empty', () => {
    const { result } = renderHook(() => useQuestionnaire(''), { wrapper: makeWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetQuestionnaire).not.toHaveBeenCalled()
  })
})

describe('useQuestionnaireByToken()', () => {
  it('fetches by share token', async () => {
    mockGetQuestionnaireByToken.mockResolvedValueOnce(sampleInstance)
    const { result } = renderHook(() => useQuestionnaireByToken('token-abc'), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(sampleInstance)
    expect(mockGetQuestionnaireByToken).toHaveBeenCalledWith('token-abc')
  })

  it('does not fetch when shareToken is empty', () => {
    const { result } = renderHook(() => useQuestionnaireByToken(''), { wrapper: makeWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetQuestionnaireByToken).not.toHaveBeenCalled()
  })
})

describe('useCreateQuestionnaire()', () => {
  it('calls createQuestionnaire and returns new instance', async () => {
    mockCreateQuestionnaire.mockResolvedValueOnce(sampleInstance)
    const { result } = renderHook(() => useCreateQuestionnaire(), { wrapper: makeWrapper() })
    result.current.mutate({ questionnaireTypeId: 'qt1' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(sampleInstance)
    expect(mockCreateQuestionnaire).toHaveBeenCalledWith(
      { questionnaireTypeId: 'qt1' },
      expect.any(Object),
    )
  })
})

describe('useUpdateQuestionnaire()', () => {
  it('calls updateQuestionnaire with the given id and payload', async () => {
    const updated = { ...sampleInstance, name: 'Renamed' }
    mockUpdateQuestionnaire.mockResolvedValueOnce(updated)
    const { result } = renderHook(() => useUpdateQuestionnaire('1'), { wrapper: makeWrapper() })
    result.current.mutate({ name: 'Renamed' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(updated)
    expect(mockUpdateQuestionnaire).toHaveBeenCalledWith('1', { name: 'Renamed' })
  })
})

describe('useDeleteQuestionnaire()', () => {
  it('calls deleteQuestionnaire with the given id', async () => {
    mockDeleteQuestionnaire.mockResolvedValueOnce(undefined)
    const { result } = renderHook(() => useDeleteQuestionnaire(), { wrapper: makeWrapper() })
    result.current.mutate('1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockDeleteQuestionnaire).toHaveBeenCalledWith('1', expect.any(Object))
  })
})

describe('useSubmitAnswers()', () => {
  it('calls submitAnswers with the given token and answers', async () => {
    const answers = { q1: 'yes' }
    const submitted = { ...sampleInstance, answers, submittedAt: '2024-01-02T00:00:00Z' }
    mockSubmitAnswers.mockResolvedValueOnce(submitted)
    const { result } = renderHook(() => useSubmitAnswers('token-abc'), { wrapper: makeWrapper() })
    result.current.mutate({ answers })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(submitted)
    expect(mockSubmitAnswers).toHaveBeenCalledWith('token-abc', answers, {})
  })

  it('forwards metrics to submitAnswers', async () => {
    const answers = { q1: 'yes' }
    const metrics = { total_score: 42 }
    const submitted = { ...sampleInstance, answers, submittedAt: '2024-01-02T00:00:00Z' }
    mockSubmitAnswers.mockResolvedValueOnce(submitted)
    const { result } = renderHook(() => useSubmitAnswers('token-abc'), { wrapper: makeWrapper() })
    result.current.mutate({ answers, metrics })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockSubmitAnswers).toHaveBeenCalledWith('token-abc', answers, metrics)
  })
})
