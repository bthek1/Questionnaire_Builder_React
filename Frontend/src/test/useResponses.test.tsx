import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import type { QuestionnaireResponse } from '@/types'

vi.mock('@/api/responses', () => ({
  submitResponse: vi.fn(),
  getResponses: vi.fn(),
}))

import { submitResponse, getResponses } from '@/api/responses'
import { useSubmitResponse, useResponses, responseKeys } from '@/hooks/useResponses'

const mockSubmitResponse = submitResponse as ReturnType<typeof vi.fn>
const mockGetResponses = getResponses as ReturnType<typeof vi.fn>

const sampleResponse: QuestionnaireResponse = {
  id: 'r1',
  questionnaireTypeId: 'q1',
  answers: [{ questionId: 'q1', value: 'yes' }],
  submittedAt: '2024-01-02T00:00:00Z',
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

describe('responseKeys', () => {
  it('all key includes questionnaireId', () => {
    expect(responseKeys.all('q1')).toEqual(['responses', 'q1'])
  })
})

describe('useSubmitResponse()', () => {
  it('calls submitResponse and returns the created response', async () => {
    mockSubmitResponse.mockResolvedValueOnce(sampleResponse)
    const { result } = renderHook(() => useSubmitResponse('q1'), { wrapper: makeWrapper() })
    result.current.mutate({ answer1: 'yes' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockSubmitResponse).toHaveBeenCalledWith('q1', { answer1: 'yes' })
    expect(result.current.data).toEqual(sampleResponse)
  })

  it('sets isError when submission fails', async () => {
    mockSubmitResponse.mockRejectedValueOnce(new Error('Server error'))
    const { result } = renderHook(() => useSubmitResponse('q1'), { wrapper: makeWrapper() })
    result.current.mutate({ answer1: 'yes' })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useResponses()', () => {
  it('returns responses for a questionnaire', async () => {
    mockGetResponses.mockResolvedValueOnce([sampleResponse])
    const { result } = renderHook(() => useResponses('q1'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([sampleResponse])
    expect(mockGetResponses).toHaveBeenCalledWith('q1')
  })

  it('does not fetch when questionnaireId is empty', () => {
    const { result } = renderHook(() => useResponses(''), { wrapper: makeWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetResponses).not.toHaveBeenCalled()
  })

  it('sets isError on network failure', async () => {
    mockGetResponses.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useResponses('q1'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
