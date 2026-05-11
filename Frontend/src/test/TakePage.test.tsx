import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router'
import { routeTree } from '../routeTree.gen'
import type { Questionnaire } from '@/types'

vi.mock('@/lib/metrics', () => ({
  evaluateMetrics: vi.fn().mockReturnValue([]),
}))

vi.mock('@/components/survey/SurveyRenderer', () => ({
  SurveyRenderer: ({
    surveyJson,
    onComplete,
  }: {
    surveyJson: object
    onComplete: (data: object) => void
  }) => (
    <button
      data-testid="survey-renderer"
      data-survey-json={JSON.stringify(surveyJson)}
      onClick={() => onComplete({ q1: 'answer' })}
    >
      Complete Survey
    </button>
  ),
}))

vi.mock('@/hooks/useQuestionnaires', () => ({
  useQuestionnaireByToken: vi.fn(),
  useSubmitAnswers: vi.fn(),
  usePriorAnswers: vi.fn().mockReturnValue({ data: undefined }),
  useQuestionnaires: vi.fn(),
  useCreateQuestionnaire: vi.fn(),
  useDeleteQuestionnaire: vi.fn(),
}))

import {
  useQuestionnaireByToken,
  useSubmitAnswers,
  useQuestionnaires,
  useCreateQuestionnaire,
  useDeleteQuestionnaire,
} from '@/hooks/useQuestionnaires'
import { evaluateMetrics } from '@/lib/metrics'

const mockUseQuestionnaireByToken = useQuestionnaireByToken as ReturnType<typeof vi.fn>
const mockUseSubmitAnswers = useSubmitAnswers as ReturnType<typeof vi.fn>
const mockUseQuestionnaires = useQuestionnaires as ReturnType<typeof vi.fn>
const mockUseCreateQuestionnaire = useCreateQuestionnaire as ReturnType<typeof vi.fn>
const mockUseDeleteQuestionnaire = useDeleteQuestionnaire as ReturnType<typeof vi.fn>
const mockEvaluateMetrics = evaluateMetrics as ReturnType<typeof vi.fn>

vi.mock('@/hooks/useQuestionnaireTypes', () => ({
  useQuestionnaireTypes: vi.fn().mockReturnValue({ data: [], isLoading: false }),
  useCreateQuestionnaireType: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useDeleteQuestionnaireType: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useUpdateQuestionnaireType: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useQuestionnaireType: vi.fn().mockReturnValue({ data: undefined, isLoading: false }),
}))

const instanceWithSurvey: Questionnaire = {
  id: 'inst1',
  questionnaireTypeId: 'q1',
  questionnaireType: {
    id: 'q1',
    title: 'My Test Survey',
    questionnaireJson: { pages: [{ name: 'page1', elements: [{ type: 'text', name: 'q1' }] }] },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  name: '',
  shareToken: 'token-abc',
  answers: {},
  submittedAt: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

const instanceWithoutSurvey: Questionnaire = {
  ...instanceWithSurvey,
  id: 'inst2',
  shareToken: 'token-xyz',
  questionnaireType: {
    id: 'q2',
    title: 'Empty Survey',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
}

const submittedInstance: Questionnaire = {
  ...instanceWithSurvey,
  submittedAt: '2024-01-02T00:00:00Z',
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
  mockEvaluateMetrics.mockReturnValue([])
  mockUseQuestionnaires.mockReturnValue({ data: [], isLoading: false })
  mockUseCreateQuestionnaire.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false })
  mockUseDeleteQuestionnaire.mockReturnValue({ mutate: vi.fn(), isPending: false })
})

describe('TakePage', () => {
  it('shows loading state while fetching questionnaire', async () => {
    mockUseQuestionnaireByToken.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    })
    mockUseSubmitAnswers.mockReturnValue({ mutate: vi.fn(), isError: false, reset: vi.fn() })
    renderAt('/take/token-abc')
    expect(await screen.findByText(/loading questionnaire/i)).toBeInTheDocument()
  })

  it('shows error when questionnaire not found', async () => {
    mockUseQuestionnaireByToken.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    })
    mockUseSubmitAnswers.mockReturnValue({ mutate: vi.fn(), isError: false, reset: vi.fn() })
    renderAt('/take/token-abc')
    expect(await screen.findByText(/questionnaire not found/i)).toBeInTheDocument()
  })

  it('shows already-submitted message when submittedAt is set', async () => {
    mockUseQuestionnaireByToken.mockReturnValue({
      data: submittedInstance,
      isLoading: false,
      isError: false,
    })
    mockUseSubmitAnswers.mockReturnValue({ mutate: vi.fn(), isError: false, reset: vi.fn() })
    renderAt('/take/token-abc')
    expect(await screen.findByText(/already submitted/i)).toBeInTheDocument()
  })

  it('shows message when questionnaire has no survey content', async () => {
    mockUseQuestionnaireByToken.mockReturnValue({
      data: instanceWithoutSurvey,
      isLoading: false,
      isError: false,
    })
    mockUseSubmitAnswers.mockReturnValue({ mutate: vi.fn(), isError: false, reset: vi.fn() })
    renderAt('/take/token-xyz')
    expect(await screen.findByText(/no survey content yet/i)).toBeInTheDocument()
  })

  it('renders the survey title and SurveyRenderer when surveyJson exists', async () => {
    mockUseQuestionnaireByToken.mockReturnValue({
      data: instanceWithSurvey,
      isLoading: false,
      isError: false,
    })
    mockUseSubmitAnswers.mockReturnValue({ mutate: vi.fn(), isError: false, reset: vi.fn() })
    renderAt('/take/token-abc')
    expect(await screen.findByRole('heading', { name: /my test survey/i })).toBeInTheDocument()
    expect(screen.getByTestId('survey-renderer')).toBeInTheDocument()
  })

  it('shows thank-you message after successful submission', async () => {
    const mockMutate = vi
      .fn()
      .mockImplementation((_data: unknown, options: { onSuccess?: () => void }) => {
        options?.onSuccess?.()
      })
    mockUseQuestionnaireByToken.mockReturnValue({
      data: instanceWithSurvey,
      isLoading: false,
      isError: false,
    })
    mockUseSubmitAnswers.mockReturnValue({ mutate: mockMutate, isError: false, reset: vi.fn() })
    renderAt('/take/token-abc')

    fireEvent.click(await screen.findByTestId('survey-renderer'))
    await waitFor(() => expect(screen.getByText(/thank you/i)).toBeInTheDocument())
  })

  it('shows error state when submission fails', async () => {
    mockUseQuestionnaireByToken.mockReturnValue({
      data: instanceWithSurvey,
      isLoading: false,
      isError: false,
    })
    mockUseSubmitAnswers.mockReturnValue({ mutate: vi.fn(), isError: true, reset: vi.fn() })
    renderAt('/take/token-abc')
    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument()
  })

  it('calls reset when try again is clicked after submission error', async () => {
    const mockReset = vi.fn()
    mockUseQuestionnaireByToken.mockReturnValue({
      data: instanceWithSurvey,
      isLoading: false,
      isError: false,
    })
    mockUseSubmitAnswers.mockReturnValue({ mutate: vi.fn(), isError: true, reset: mockReset })
    renderAt('/take/token-abc')
    fireEvent.click(await screen.findByRole('button', { name: /try again/i }))
    expect(mockReset).toHaveBeenCalled()
  })

  it('calls mutate with non-empty metrics when calculatedValues are present', async () => {
    const mockMutate = vi
      .fn()
      .mockImplementation((_data: unknown, options: { onSuccess?: () => void }) => {
        options?.onSuccess?.()
      })
    mockEvaluateMetrics.mockReturnValue([{ name: 'total_score', label: 'Total Score', value: 42 }])
    mockUseQuestionnaireByToken.mockReturnValue({
      data: instanceWithSurvey,
      isLoading: false,
      isError: false,
    })
    mockUseSubmitAnswers.mockReturnValue({ mutate: mockMutate, isError: false, reset: vi.fn() })
    renderAt('/take/token-abc')

    fireEvent.click(await screen.findByTestId('survey-renderer'))
    await waitFor(() =>
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({ metrics: { total_score: 42 } }),
        expect.any(Object),
      ),
    )
  })

  it('calls mutate with empty metrics when no calculatedValues are defined', async () => {
    const mockMutate = vi
      .fn()
      .mockImplementation((_data: unknown, options: { onSuccess?: () => void }) => {
        options?.onSuccess?.()
      })
    mockEvaluateMetrics.mockReturnValue([])
    mockUseQuestionnaireByToken.mockReturnValue({
      data: instanceWithSurvey,
      isLoading: false,
      isError: false,
    })
    mockUseSubmitAnswers.mockReturnValue({ mutate: mockMutate, isError: false, reset: vi.fn() })
    renderAt('/take/token-abc')

    fireEvent.click(await screen.findByTestId('survey-renderer'))
    await waitFor(() =>
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({ metrics: {} }),
        expect.any(Object),
      ),
    )
  })

  it('wraps a bare element recipientJson into a recipient page', async () => {
    const instanceWithBareElement = {
      ...instanceWithSurvey,
      questionnaireType: {
        ...instanceWithSurvey.questionnaireType!,
        recipientJson: { type: 'radiogroup', name: 'recipient__respondent_type', choices: ['A'] },
      },
    }
    mockUseQuestionnaireByToken.mockReturnValue({
      data: instanceWithBareElement,
      isLoading: false,
      isError: false,
    })
    mockUseSubmitAnswers.mockReturnValue({ mutate: vi.fn(), isError: false, reset: vi.fn() })
    renderAt('/take/token-abc')
    const renderer = await screen.findByTestId('survey-renderer')
    const json = JSON.parse(renderer.getAttribute('data-survey-json')!)
    expect(json.pages[0].name).toBe('recipient_page')
    expect(json.pages[0].elements[0].type).toBe('radiogroup')
    expect(json.pages[1].name).toBe('page1')
  })

  it('promotes flat elements survey to pages when merging recipient', async () => {
    const instanceFlatSurvey = {
      ...instanceWithSurvey,
      questionnaireType: {
        ...instanceWithSurvey.questionnaireType!,
        questionnaireJson: { title: 'Flat survey', elements: [{ type: 'text', name: 'q1' }] },
        recipientJson: {
          name: 'recipient_page',
          elements: [{ type: 'radiogroup', name: 'recipient__respondent_type' }],
        },
      },
    }
    mockUseQuestionnaireByToken.mockReturnValue({
      data: instanceFlatSurvey,
      isLoading: false,
      isError: false,
    })
    mockUseSubmitAnswers.mockReturnValue({ mutate: vi.fn(), isError: false, reset: vi.fn() })
    renderAt('/take/token-abc')
    const renderer = await screen.findByTestId('survey-renderer')
    const json = JSON.parse(renderer.getAttribute('data-survey-json')!)
    // Must have 2 pages — recipient first, promoted main page second
    expect(json.pages).toHaveLength(2)
    expect(json.pages[0].name).toBe('recipient_page')
    expect(json.pages[1].elements[0].name).toBe('q1')
    // flat elements key must not appear alongside pages
    expect(json.elements).toBeUndefined()
  })

  it('prepends recipient page when recipientJson is set', async () => {
    const instanceWithRecipient = {
      ...instanceWithSurvey,
      questionnaireType: {
        ...instanceWithSurvey.questionnaireType!,
        recipientJson: {
          name: 'recipient_page',
          elements: [{ type: 'radiogroup', name: 'recipient__respondent_type' }],
        },
      },
    }
    mockUseQuestionnaireByToken.mockReturnValue({
      data: instanceWithRecipient,
      isLoading: false,
      isError: false,
    })
    mockUseSubmitAnswers.mockReturnValue({ mutate: vi.fn(), isError: false, reset: vi.fn() })
    renderAt('/take/token-abc')
    const renderer = await screen.findByTestId('survey-renderer')
    const json = JSON.parse(renderer.getAttribute('data-survey-json')!)
    expect(json.pages[0].name).toBe('recipient_page')
    expect(json.pages[1].name).toBe('page1')
  })

  it('does not prepend recipient page when recipientJson is null', async () => {
    const instanceWithoutRecipient = {
      ...instanceWithSurvey,
      questionnaireType: {
        ...instanceWithSurvey.questionnaireType!,
        recipientJson: null,
      },
    }
    mockUseQuestionnaireByToken.mockReturnValue({
      data: instanceWithoutRecipient,
      isLoading: false,
      isError: false,
    })
    mockUseSubmitAnswers.mockReturnValue({ mutate: vi.fn(), isError: false, reset: vi.fn() })
    renderAt('/take/token-abc')
    const renderer = await screen.findByTestId('survey-renderer')
    const json = JSON.parse(renderer.getAttribute('data-survey-json')!)
    expect(json.pages).toHaveLength(1)
    expect(json.pages[0].name).toBe('page1')
  })
})
