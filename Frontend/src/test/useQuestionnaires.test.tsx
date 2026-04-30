import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import type { Questionnaire } from '@/types'

vi.mock('@/api/questionnaires', () => ({
  getQuestionnaires: vi.fn(),
  getQuestionnaire: vi.fn(),
  createQuestionnaire: vi.fn(),
  updateQuestionnaire: vi.fn(),
  deleteQuestionnaire: vi.fn(),
}))

import {
  getQuestionnaires,
  getQuestionnaire,
  createQuestionnaire,
  deleteQuestionnaire,
} from '@/api/questionnaires'
import {
  useQuestionnaires,
  useQuestionnaire,
  useCreateQuestionnaire,
  useDeleteQuestionnaire,
  questionnaireKeys,
} from '@/hooks/useQuestionnaires'

const mockGetQuestionnaires = getQuestionnaires as ReturnType<typeof vi.fn>
const mockGetQuestionnaire = getQuestionnaire as ReturnType<typeof vi.fn>
const mockCreateQuestionnaire = createQuestionnaire as ReturnType<typeof vi.fn>
const mockDeleteQuestionnaire = deleteQuestionnaire as ReturnType<typeof vi.fn>

const sampleQuestionnaire: Questionnaire = {
  id: '1',
  title: 'Survey One',
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
})

describe('useQuestionnaires()', () => {
  it('returns list of questionnaires on success', async () => {
    mockGetQuestionnaires.mockResolvedValueOnce([sampleQuestionnaire])
    const { result } = renderHook(() => useQuestionnaires(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([sampleQuestionnaire])
  })

  it('sets isError on failure', async () => {
    mockGetQuestionnaires.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useQuestionnaires(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useQuestionnaire()', () => {
  it('fetches a single questionnaire by id', async () => {
    mockGetQuestionnaire.mockResolvedValueOnce(sampleQuestionnaire)
    const { result } = renderHook(() => useQuestionnaire('1'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(sampleQuestionnaire)
    expect(mockGetQuestionnaire).toHaveBeenCalledWith('1')
  })

  it('does not fetch when id is empty', () => {
    const { result } = renderHook(() => useQuestionnaire(''), { wrapper: makeWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetQuestionnaire).not.toHaveBeenCalled()
  })
})

describe('useCreateQuestionnaire()', () => {
  it('calls createQuestionnaire and returns created entity', async () => {
    mockCreateQuestionnaire.mockResolvedValueOnce(sampleQuestionnaire)
    const { result } = renderHook(() => useCreateQuestionnaire(), { wrapper: makeWrapper() })
    result.current.mutate({ title: 'Survey One' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(sampleQuestionnaire)
  })
})

describe('useDeleteQuestionnaire()', () => {
  it('calls deleteQuestionnaire with correct id', async () => {
    mockDeleteQuestionnaire.mockResolvedValueOnce(undefined)
    const { result } = renderHook(() => useDeleteQuestionnaire(), { wrapper: makeWrapper() })
    result.current.mutate('1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockDeleteQuestionnaire).toHaveBeenCalledWith('1', expect.any(Object))
  })
})
