import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router'
import { routeTree } from '../routeTree.gen'
import type { QuestionnaireType } from '@/types'

vi.mock('@/components/survey/SurveyRenderer', () => ({
  SurveyRenderer: ({ onComplete }: { onComplete: (data: object) => void }) => (
    <button data-testid="survey-renderer" onClick={() => onComplete({ q1: 'answer' })}>
      Complete Survey
    </button>
  ),
}))

vi.mock('@/hooks/useQuestionnaires', () => ({
  useQuestionnaireType: vi.fn(),
  useQuestionnaireTypes: vi.fn(),
  useCreateQuestionnaireType: vi.fn(),
  useDeleteQuestionnaireType: vi.fn(),
}))
vi.mock('@/hooks/useResponses', () => ({
  useSubmitResponse: vi.fn(),
  useResponses: vi.fn(),
}))

import {
  useQuestionnaireType,
  useQuestionnaireTypes,
  useCreateQuestionnaireType,
  useDeleteQuestionnaireType,
} from '@/hooks/useQuestionnaires'
import { useSubmitResponse, useResponses } from '@/hooks/useResponses'

const mockUseQuestionnaire = useQuestionnaireType as ReturnType<typeof vi.fn>
const mockUseQuestionnaires = useQuestionnaireTypes as ReturnType<typeof vi.fn>
const mockUseCreateQuestionnaire = useCreateQuestionnaireType as ReturnType<typeof vi.fn>
const mockUseDeleteQuestionnaire = useDeleteQuestionnaireType as ReturnType<typeof vi.fn>
const mockUseSubmitResponse = useSubmitResponse as ReturnType<typeof vi.fn>
const mockUseResponses = useResponses as ReturnType<typeof vi.fn>

const questionnaireWithSurvey: QuestionnaireType = {
  id: 'q1',
  title: 'My Test Survey',
  surveyJson: { pages: [{ name: 'page1', elements: [{ type: 'text', name: 'q1' }] }] },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

const questionnaireWithoutSurvey: QuestionnaireType = {
  id: 'q2',
  title: 'Empty Survey',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

function renderAt(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const history = createMemoryHistory({ initialEntries: [path] })
  const router = createRouter({ routeTree, history })
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseQuestionnaires.mockReturnValue({ data: [], isLoading: false })
  mockUseCreateQuestionnaire.mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
  })
  mockUseDeleteQuestionnaire.mockReturnValue({ mutate: vi.fn(), isPending: false })
  mockUseResponses.mockReturnValue({ data: [], isLoading: false })
})

describe('TakePage', () => {
  it('shows loading state while fetching questionnaire', async () => {
    mockUseQuestionnaire.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    mockUseSubmitResponse.mockReturnValue({ mutate: vi.fn(), isError: false, reset: vi.fn() })
    renderAt('/take/q1')
    expect(await screen.findByText(/loading questionnaire/i)).toBeInTheDocument()
  })

  it('shows error when questionnaire not found', async () => {
    mockUseQuestionnaire.mockReturnValue({ data: undefined, isLoading: false, isError: true })
    mockUseSubmitResponse.mockReturnValue({ mutate: vi.fn(), isError: false, reset: vi.fn() })
    renderAt('/take/q1')
    expect(await screen.findByText(/questionnaire not found/i)).toBeInTheDocument()
  })

  it('shows message when questionnaire has no survey content', async () => {
    mockUseQuestionnaire.mockReturnValue({
      data: questionnaireWithoutSurvey,
      isLoading: false,
      isError: false,
    })
    mockUseSubmitResponse.mockReturnValue({ mutate: vi.fn(), isError: false, reset: vi.fn() })
    renderAt('/take/q2')
    expect(await screen.findByText(/no survey content yet/i)).toBeInTheDocument()
  })

  it('renders the survey title and SurveyRenderer when surveyJson exists', async () => {
    mockUseQuestionnaire.mockReturnValue({
      data: questionnaireWithSurvey,
      isLoading: false,
      isError: false,
    })
    mockUseSubmitResponse.mockReturnValue({ mutate: vi.fn(), isError: false, reset: vi.fn() })
    renderAt('/take/q1')
    expect(await screen.findByRole('heading', { name: /my test survey/i })).toBeInTheDocument()
    expect(screen.getByTestId('survey-renderer')).toBeInTheDocument()
  })

  it('shows thank-you message after successful submission', async () => {
    const mockMutate = vi.fn().mockImplementation((_data, options) => {
      options?.onSuccess?.()
    })
    mockUseQuestionnaire.mockReturnValue({
      data: questionnaireWithSurvey,
      isLoading: false,
      isError: false,
    })
    mockUseSubmitResponse.mockReturnValue({ mutate: mockMutate, isError: false, reset: vi.fn() })
    renderAt('/take/q1')

    fireEvent.click(await screen.findByTestId('survey-renderer'))
    await waitFor(() => expect(screen.getByText(/thank you/i)).toBeInTheDocument())
    expect(screen.getByText(/my test survey/i)).toBeInTheDocument()
  })

  it('shows error state when submission fails', async () => {
    mockUseQuestionnaire.mockReturnValue({
      data: questionnaireWithSurvey,
      isLoading: false,
      isError: false,
    })
    mockUseSubmitResponse.mockReturnValue({
      mutate: vi.fn(),
      isError: true,
      reset: vi.fn(),
    })
    renderAt('/take/q1')
    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument()
  })

  it('calls reset when try again is clicked after submission error', async () => {
    const mockReset = vi.fn()
    mockUseQuestionnaire.mockReturnValue({
      data: questionnaireWithSurvey,
      isLoading: false,
      isError: false,
    })
    mockUseSubmitResponse.mockReturnValue({
      mutate: vi.fn(),
      isError: true,
      reset: mockReset,
    })
    renderAt('/take/q1')
    fireEvent.click(await screen.findByRole('button', { name: /try again/i }))
    expect(mockReset).toHaveBeenCalled()
  })
})
