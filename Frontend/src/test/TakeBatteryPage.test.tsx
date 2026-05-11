import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import { vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router'
import { routeTree } from '../routeTree.gen'
import type { Battery } from '@/types'

vi.mock('@/hooks/useBatteries', () => ({
  useBatteries: vi.fn().mockReturnValue({ data: [], isLoading: false }),
  useDeleteBattery: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useCreateBattery: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useBattery: vi.fn().mockReturnValue({ data: undefined, isLoading: false }),
  useBatteryByToken: vi.fn(),
  batteryKeys: {
    all: ['batteries'] as const,
    detail: (id: string) => ['batteries', id] as const,
    byToken: (token: string) => ['batteries', 'token', token] as const,
  },
}))

vi.mock('@/hooks/useBatteryTypes', () => ({
  useBatteryTypes: vi.fn().mockReturnValue({ data: [], isLoading: false }),
  useCreateBatteryType: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useDeleteBatteryType: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useUpdateBatteryType: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useBatteryType: vi.fn().mockReturnValue({ data: undefined, isLoading: false }),
}))

vi.mock('@/hooks/useQuestionnaireTypes', () => ({
  useQuestionnaireTypes: vi.fn().mockReturnValue({ data: [], isLoading: false }),
  useCreateQuestionnaireType: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useDeleteQuestionnaireType: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useUpdateQuestionnaireType: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@/hooks/useQuestionnaires', () => ({
  useQuestionnaires: vi.fn().mockReturnValue({ data: [], isLoading: false }),
  useDeleteQuestionnaire: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useCreateQuestionnaire: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useQuestionnaire: vi.fn().mockReturnValue({ data: undefined, isLoading: false }),
  useQuestionnaireByToken: vi.fn(),
  useSubmitAnswers: vi.fn(),
  usePriorAnswers: vi.fn().mockReturnValue({ data: undefined }),
  useUpdateQuestionnaire: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@/components/survey/SurveyRenderer', () => ({
  SurveyRenderer: ({ onComplete }: { onComplete: (data: Record<string, unknown>) => void }) => (
    <div data-testid="survey-renderer">
      <button onClick={() => onComplete({ q1: 'answer' })}>Submit Survey</button>
    </div>
  ),
  SURVEY_THEMES: {},
  DEFAULT_THEME_KEY: 'Default',
}))

vi.mock('@/components/survey/SurveyDashboard', () => ({
  SurveyDashboard: () => <div>Dashboard</div>,
}))

vi.mock('@/lib/metrics', () => ({
  evaluateMetrics: vi.fn().mockReturnValue([]),
}))

import { useBatteryByToken } from '@/hooks/useBatteries'
import { useQuestionnaireByToken, useSubmitAnswers } from '@/hooks/useQuestionnaires'

const mockUseBatteryByToken = useBatteryByToken as ReturnType<typeof vi.fn>
const mockUseQuestionnaireByToken = useQuestionnaireByToken as ReturnType<typeof vi.fn>
const mockUseSubmitAnswers = useSubmitAnswers as ReturnType<typeof vi.fn>

const mockSubmitMutate = vi.fn()

const completedBattery: Battery = {
  id: 'b1',
  batteryTypeId: 'bt1',
  batteryTypeName: 'Test Battery',
  name: 'Test Run',
  shareToken: 'tok-abc',
  questionnaires: [
    {
      order: 0,
      questionnaireId: 'q1',
      shareToken: 'qt1',
      questionnaireTypeName: 'Survey 1',
      submittedAt: '2024-01-01T00:00:00Z',
    },
    {
      order: 1,
      questionnaireId: 'q2',
      shareToken: 'qt2',
      questionnaireTypeName: 'Survey 2',
      submittedAt: '2024-01-02T00:00:00Z',
    },
  ],
  isComplete: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

const pendingBattery: Battery = {
  ...completedBattery,
  questionnaires: [
    {
      order: 0,
      questionnaireId: 'q1',
      shareToken: 'qt1',
      questionnaireTypeName: 'Survey 1',
      submittedAt: null,
    },
    {
      order: 1,
      questionnaireId: 'q2',
      shareToken: 'qt2',
      questionnaireTypeName: 'Survey 2',
      submittedAt: null,
    },
  ],
  isComplete: false,
}

function renderAt(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const history = createMemoryHistory({ initialEntries: [path] })
  const router = createRouter({ routeTree, history })
  const result = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return { ...result, queryClient }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseSubmitAnswers.mockReturnValue({ mutate: mockSubmitMutate, isPending: false, isSuccess: false })
  mockUseQuestionnaireByToken.mockReturnValue({ data: undefined, isLoading: false })
})

describe('TakeBatteryPage', () => {
  it('shows loading state', async () => {
    mockUseBatteryByToken.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    renderAt('/take-battery/tok-abc')
    await screen.findByText(/loading battery/i)
  })

  it('shows error when battery not found', async () => {
    mockUseBatteryByToken.mockReturnValue({ data: undefined, isLoading: false, isError: true })
    renderAt('/take-battery/tok-abc')
    await screen.findByText(/battery not found/i)
  })

  it('shows completion screen when all surveys submitted', async () => {
    mockUseBatteryByToken.mockReturnValue({
      data: completedBattery,
      isLoading: false,
      isError: false,
    })
    renderAt('/take-battery/tok-abc')
    await screen.findByText(/all done/i)
    await screen.findByText(/all surveys in this battery are complete/i)
  })

  it('shows progress and survey renderer for pending battery', async () => {
    mockUseBatteryByToken.mockReturnValue({
      data: pendingBattery,
      isLoading: false,
      isError: false,
    })
    mockUseQuestionnaireByToken.mockReturnValue({
      data: {
        id: 'q1',
        questionnaireTypeId: 'qt1',
        questionnaireType: {
          id: 'qt1',
          title: 'Survey 1',
          questionnaireJson: { pages: [{ elements: [{ type: 'text', name: 'q1' }] }] },
          createdAt: '',
          updatedAt: '',
        },
        name: '',
        shareToken: 'qt1',
        answers: {},
        submittedAt: null,
        createdAt: '',
        updatedAt: '',
      },
      isLoading: false,
    })
    renderAt('/take-battery/tok-abc')
    await screen.findByText(/survey 1 of 2/i)
    await waitFor(() => {
      expect(screen.getByTestId('survey-renderer')).toBeInTheDocument()
    })
  })

  it('shows Submitting spinner while mutation is pending', async () => {
    mockUseBatteryByToken.mockReturnValue({
      data: pendingBattery,
      isLoading: false,
      isError: false,
    })
    mockUseSubmitAnswers.mockReturnValue({ mutate: vi.fn(), isPending: true, isSuccess: false })
    mockUseQuestionnaireByToken.mockReturnValue({
      data: {
        id: 'q1',
        questionnaireTypeId: 'qt1',
        questionnaireType: {
          id: 'qt1',
          questionnaireJson: { pages: [{ elements: [{ type: 'text', name: 'q1' }] }] },
          createdAt: '',
          updatedAt: '',
        },
        name: '',
        shareToken: 'qt1',
        answers: {},
        submittedAt: null,
        createdAt: '',
        updatedAt: '',
      },
      isLoading: false,
    })
    renderAt('/take-battery/tok-abc')
    await screen.findByText(/submitting…/i)
    expect(screen.queryByTestId('survey-renderer')).not.toBeInTheDocument()
  })

  it('shows the next unsubmitted slot when earlier slots are already submitted', async () => {
    const partialBattery = {
      ...pendingBattery,
      questionnaires: [
        {
          order: 0,
          questionnaireId: 'q1',
          shareToken: 'qt1',
          questionnaireTypeName: 'Survey 1',
          submittedAt: '2024-01-01T00:00:00Z',
        },
        {
          order: 1,
          questionnaireId: 'q2',
          shareToken: 'qt2',
          questionnaireTypeName: 'Survey 2',
          submittedAt: null,
        },
      ],
    }
    mockUseBatteryByToken.mockReturnValue({
      data: partialBattery,
      isLoading: false,
      isError: false,
    })
    mockUseQuestionnaireByToken.mockReturnValue({
      data: {
        id: 'q2',
        questionnaireTypeId: 'qt2',
        questionnaireType: {
          id: 'qt2',
          questionnaireJson: { pages: [{ elements: [{ type: 'text', name: 'q2' }] }] },
          createdAt: '',
          updatedAt: '',
        },
        name: '',
        shareToken: 'qt2',
        answers: {},
        submittedAt: null,
        createdAt: '',
        updatedAt: '',
      },
      isLoading: false,
    })
    renderAt('/take-battery/tok-abc')
    await screen.findByText(/survey 2 of 2/i)
    expect(screen.getByTestId('survey-renderer')).toBeInTheDocument()
  })

  it('navigates to /batteries after submitting the last questionnaire', async () => {
    const lastSlotBattery = {
      ...pendingBattery,
      questionnaires: [
        {
          order: 0,
          questionnaireId: 'q1',
          shareToken: 'qt1',
          questionnaireTypeName: 'Survey 1',
          submittedAt: null,
        },
      ],
    }
    mockUseBatteryByToken.mockReturnValue({
      data: lastSlotBattery,
      isLoading: false,
      isError: false,
    })
    mockUseQuestionnaireByToken.mockReturnValue({
      data: {
        id: 'q1',
        questionnaireTypeId: 'qt1',
        questionnaireType: {
          id: 'qt1',
          questionnaireJson: { pages: [{ elements: [{ type: 'text', name: 'q1' }] }] },
          createdAt: '',
          updatedAt: '',
        },
        name: '',
        shareToken: 'qt1',
        answers: {},
        submittedAt: null,
        createdAt: '',
        updatedAt: '',
      },
      isLoading: false,
    })
    mockSubmitMutate.mockImplementation(
      (_data: unknown, { onSuccess }: { onSuccess: () => void }) => onSuccess(),
    )

    renderAt('/take-battery/tok-abc')
    const submitBtn = await screen.findByRole('button', { name: /submit survey/i })

    await act(async () => {
      fireEvent.click(submitBtn)
    })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /batteries/i })).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('calls invalidateQueries for battery token after submitting a non-last questionnaire', async () => {
    mockUseBatteryByToken.mockReturnValue({
      data: pendingBattery,
      isLoading: false,
      isError: false,
    })
    mockUseQuestionnaireByToken.mockReturnValue({
      data: {
        id: 'q1',
        questionnaireTypeId: 'qt1',
        questionnaireType: {
          id: 'qt1',
          questionnaireJson: { pages: [{ elements: [{ type: 'text', name: 'q1' }] }] },
          createdAt: '',
          updatedAt: '',
        },
        name: '',
        shareToken: 'qt1',
        answers: {},
        submittedAt: null,
        createdAt: '',
        updatedAt: '',
      },
      isLoading: false,
    })

    let capturedOnSuccess: (() => void) | undefined
    mockSubmitMutate.mockImplementation(
      (_data: unknown, { onSuccess }: { onSuccess: () => void }) => {
        capturedOnSuccess = onSuccess
      },
    )

    const { queryClient } = renderAt('/take-battery/tok-abc')
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue()

    const submitBtn = await screen.findByRole('button', { name: /submit survey/i })

    await act(async () => {
      fireEvent.click(submitBtn)
    })

    // onSuccess is captured — now call it
    await act(async () => {
      capturedOnSuccess?.()
    })

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['batteries', 'token', 'tok-abc'] }),
    )
  })
})
