import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import type { QuestionnaireType } from '@/types'

vi.mock('@/api/questionnaires', () => ({
  getQuestionnaireTypes: vi.fn(),
  getQuestionnaireType: vi.fn(),
  createQuestionnaireType: vi.fn(),
  updateQuestionnaireType: vi.fn(),
  deleteQuestionnaireType: vi.fn(),
}))

import {
  getQuestionnaireTypes,
  getQuestionnaireType,
  createQuestionnaireType,
  deleteQuestionnaireType,
} from '@/api/questionnaires'
import {
  useQuestionnaireTypes,
  useQuestionnaireType,
  useCreateQuestionnaireType,
  useDeleteQuestionnaireType,
  questionnaireTypeKeys,
} from '@/hooks/useQuestionnaires'

const mockGetQuestionnaireTypes = getQuestionnaireTypes as ReturnType<typeof vi.fn>
const mockGetQuestionnaireType = getQuestionnaireType as ReturnType<typeof vi.fn>
const mockCreateQuestionnaireType = createQuestionnaireType as ReturnType<typeof vi.fn>
const mockDeleteQuestionnaireType = deleteQuestionnaireType as ReturnType<typeof vi.fn>

const sampleQuestionnaire: QuestionnaireType = {
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

describe('questionnaireTypeKeys', () => {
  it('all key is stable', () => {
    expect(questionnaireTypeKeys.all).toEqual(['questionnaires'])
  })

  it('detail key includes id', () => {
    expect(questionnaireTypeKeys.detail('abc')).toEqual(['questionnaires', 'abc'])
  })
})

describe('useQuestionnaireTypes()', () => {
  it('returns list of questionnaires on success', async () => {
    mockGetQuestionnaireTypes.mockResolvedValueOnce([sampleQuestionnaire])
    const { result } = renderHook(() => useQuestionnaireTypes(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([sampleQuestionnaire])
  })

  it('sets isError on failure', async () => {
    mockGetQuestionnaireTypes.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useQuestionnaireTypes(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useQuestionnaireType()', () => {
  it('fetches a single questionnaire by id', async () => {
    mockGetQuestionnaireType.mockResolvedValueOnce(sampleQuestionnaire)
    const { result } = renderHook(() => useQuestionnaireType('1'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(sampleQuestionnaire)
    expect(mockGetQuestionnaireType).toHaveBeenCalledWith('1')
  })

  it('does not fetch when id is empty', () => {
    const { result } = renderHook(() => useQuestionnaireType(''), { wrapper: makeWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetQuestionnaireType).not.toHaveBeenCalled()
  })
})

describe('useCreateQuestionnaireType()', () => {
  it('calls createQuestionnaireType and returns created entity', async () => {
    mockCreateQuestionnaireType.mockResolvedValueOnce(sampleQuestionnaire)
    const { result } = renderHook(() => useCreateQuestionnaireType(), { wrapper: makeWrapper() })
    result.current.mutate({ title: 'Survey One' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(sampleQuestionnaire)
  })
})

describe('useDeleteQuestionnaireType()', () => {
  it('calls deleteQuestionnaireType with correct id', async () => {
    mockDeleteQuestionnaireType.mockResolvedValueOnce(undefined)
    const { result } = renderHook(() => useDeleteQuestionnaireType(), { wrapper: makeWrapper() })
    result.current.mutate('1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockDeleteQuestionnaireType).toHaveBeenCalledWith('1', expect.any(Object))
  })
})
