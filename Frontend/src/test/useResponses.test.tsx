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
  deleteQuestionnaire: vi.fn(),
  submitAnswers: vi.fn(),
}))

import {
  getQuestionnaires,
  getQuestionnaire,
  getQuestionnaireByToken,
  createQuestionnaire,
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
  questionnaireKeys,
} from '@/hooks/useQuestionnaires'

const mockGetQuestionnaires = getQuestionnaires as ReturnType<typeof vi.fn>
const mockGetQuestionnaire = getQuestionnaire as ReturnType<typeof vi.fn>
const mockGetByToken = getQuestionnaireByToken as ReturnType<typeof vi.fn>
const mockCreate = createQuestionnaire as ReturnType<typeof vi.fn>
const mockDelete = deleteQuestionnaire as ReturnType<typeof vi.fn>
const mockSubmitAnswers = submitAnswers as ReturnType<typeof vi.fn>

const sampleInstance: Questionnaire = {
  id: 'inst1',
  questionnaireTypeId: 'qt1',
  name: '',
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
    expect(questionnaireKeys.byToken('token-abc')).toEqual(['questionnaires', 'token', 'token-abc'])
  })
})

describe('useQuestionnaires()', () => {
  it('returns list of instances', async () => {
    mockGetQuestionnaires.mockResolvedValueOnce([sampleInstance])
    const { result } = renderHook(() => useQuestionnaires(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([sampleInstance])
  })
})

describe('useQuestionnaire()', () => {
  it('fetches by id', async () => {
    mockGetQuestionnaire.mockResolvedValueOnce(sampleInstance)
    const { result } = renderHook(() => useQuestionnaire('inst1'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(sampleInstance)
  })

  it('skips fetch when id is empty', () => {
    const { result } = renderHook(() => useQuestionnaire(''), { wrapper: makeWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetQuestionnaire).not.toHaveBeenCalled()
  })
})

describe('useQuestionnaireByToken()', () => {
  it('fetches by share token', async () => {
    mockGetByToken.mockResolvedValueOnce(sampleInstance)
    const { result } = renderHook(() => useQuestionnaireByToken('token-abc'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(sampleInstance)
    expect(mockGetByToken).toHaveBeenCalledWith('token-abc')
  })

  it('skips fetch when token is empty', () => {
    const { result } = renderHook(() => useQuestionnaireByToken(''), { wrapper: makeWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useCreateQuestionnaire()', () => {
  it('calls createQuestionnaire and returns new instance', async () => {
    mockCreate.mockResolvedValueOnce(sampleInstance)
    const { result } = renderHook(() => useCreateQuestionnaire(), { wrapper: makeWrapper() })
    result.current.mutate({ questionnaireTypeId: 'qt1' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockCreate).toHaveBeenCalledWith({ questionnaireTypeId: 'qt1' }, expect.any(Object))
    expect(result.current.data).toEqual(sampleInstance)
  })
})

describe('useDeleteQuestionnaire()', () => {
  it('calls deleteQuestionnaire with id', async () => {
    mockDelete.mockResolvedValueOnce(undefined)
    const { result } = renderHook(() => useDeleteQuestionnaire(), { wrapper: makeWrapper() })
    result.current.mutate('inst1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockDelete).toHaveBeenCalledWith('inst1', expect.any(Object))
  })
})

describe('useSubmitAnswers()', () => {
  it('calls submitAnswers with token and answers', async () => {
    const submitted = { ...sampleInstance, submittedAt: '2024-01-02T00:00:00Z', answers: { q1: 'yes' } }
    mockSubmitAnswers.mockResolvedValueOnce(submitted)
    const { result } = renderHook(() => useSubmitAnswers('token-abc'), { wrapper: makeWrapper() })
    result.current.mutate({ q1: 'yes' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockSubmitAnswers).toHaveBeenCalledWith('token-abc', { q1: 'yes' })
    expect(result.current.data).toEqual(submitted)
  })

  it('sets isError on failure', async () => {
    mockSubmitAnswers.mockRejectedValueOnce(new Error('Server error'))
    const { result } = renderHook(() => useSubmitAnswers('token-abc'), { wrapper: makeWrapper() })
    result.current.mutate({ q1: 'yes' })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

