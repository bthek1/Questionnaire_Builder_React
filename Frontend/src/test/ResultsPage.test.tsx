import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router'
import { routeTree } from '../routeTree.gen'
import type { Questionnaire } from '@/types'

// Hoisted state so the mock factory can read it at module-evaluation time
const modelState = vi.hoisted(() => ({
  calcValues: [] as Array<{ name: string; value: unknown }>,
  lastConstructorArg: null as unknown,
  constructorCallCount: 0,
}))

// Mock survey-core Model as a proper class so `new Model()` works
vi.mock('survey-core', () => ({
  Model: class {
    data: unknown = {}
    constructor(json: unknown) {
      modelState.lastConstructorArg = json
      modelState.constructorCallCount++
    }
    get calculatedValues() {
      return modelState.calcValues
    }
  },
}))

vi.mock('@/hooks/useQuestionnaires', () => ({
  useQuestionnaire: vi.fn(),
  useQuestionnaires: vi.fn(),
  useCreateQuestionnaire: vi.fn(),
  useDeleteQuestionnaire: vi.fn(),
  useSubmitAnswers: vi.fn(),
  useUpdateQuestionnaire: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@/hooks/useQuestionnaireTypes', () => ({
  useQuestionnaireTypes: vi.fn().mockReturnValue({ data: [], isLoading: false }),
  useCreateQuestionnaireType: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useDeleteQuestionnaireType: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useUpdateQuestionnaireType: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
}))

import {
  useQuestionnaire,
  useQuestionnaires,
  useCreateQuestionnaire,
  useDeleteQuestionnaire,
} from '@/hooks/useQuestionnaires'

const mockUseQuestionnaire = useQuestionnaire as ReturnType<typeof vi.fn>
const mockUseQuestionnaires = useQuestionnaires as ReturnType<typeof vi.fn>
const mockUseCreateQuestionnaire = useCreateQuestionnaire as ReturnType<typeof vi.fn>
const mockUseDeleteQuestionnaire = useDeleteQuestionnaire as ReturnType<typeof vi.fn>

const surveyJsonWithCalc = {
  pages: [{ elements: [{ type: 'text', name: 'score' }] }],
  calculatedValues: [
    { name: 'totalScore', expression: '{score}', includeIntoResult: true },
    { name: 'bonus_points', expression: '42' },
  ],
}

const submittedInstance: Questionnaire = {
  id: 'inst1',
  questionnaireTypeId: 'qt1',
  questionnaireType: {
    id: 'qt1',
    title: 'Health Check',
    surveyJson: surveyJsonWithCalc,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  name: 'Run A',
  shareToken: 'token-1',
  answers: { score: 10, totalScore: 10 },
  submittedAt: '2024-06-01T12:00:00Z',
  surveyJsonSnapshot: surveyJsonWithCalc,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-06-01T12:00:00Z',
}

const pendingInstance: Questionnaire = {
  ...submittedInstance,
  id: 'inst2',
  answers: {},
  submittedAt: null,
  surveyJsonSnapshot: undefined,
  questionnaireType: {
    id: 'qt2',
    title: 'Pending Survey',
    surveyJson: { pages: [] },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
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
  modelState.calcValues = []
  modelState.lastConstructorArg = null
  modelState.constructorCallCount = 0
  mockUseQuestionnaires.mockReturnValue({ data: [], isLoading: false })
  mockUseCreateQuestionnaire.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false })
  mockUseDeleteQuestionnaire.mockReturnValue({ mutate: vi.fn(), isPending: false })
})

describe('ResultsPage', () => {
  it('shows loading skeletons while data is loading', async () => {
    mockUseQuestionnaire.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    renderAt('/questionnaires/inst1/results')
    await waitFor(() => {
      expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
    })
  })

  it('shows error message when fetch fails', async () => {
    mockUseQuestionnaire.mockReturnValue({ data: undefined, isLoading: false, isError: true })
    renderAt('/questionnaires/inst1/results')
    expect(await screen.findByText(/not found/i)).toBeInTheDocument()
  })

  it('shows questionnaire type title and name', async () => {
    mockUseQuestionnaire.mockReturnValue({
      data: submittedInstance,
      isLoading: false,
      isError: false,
    })
    renderAt('/questionnaires/inst1/results')
    expect(await screen.findByText(/Health Check/)).toBeInTheDocument()
    expect(await screen.findByText(/Run A/)).toBeInTheDocument()
  })

  it('shows Submitted badge when submittedAt is set', async () => {
    mockUseQuestionnaire.mockReturnValue({
      data: submittedInstance,
      isLoading: false,
      isError: false,
    })
    renderAt('/questionnaires/inst1/results')
    expect(await screen.findByText(/Submitted/i)).toBeInTheDocument()
  })

  it('shows Pending badge when submittedAt is null', async () => {
    mockUseQuestionnaire.mockReturnValue({
      data: pendingInstance,
      isLoading: false,
      isError: false,
    })
    renderAt('/questionnaires/inst2/results')
    // Use exact string to avoid matching the title "Pending Survey"
    expect(await screen.findByText('Pending')).toBeInTheDocument()
  })

  it('shows Download PDF button only when submitted', async () => {
    mockUseQuestionnaire.mockReturnValue({
      data: submittedInstance,
      isLoading: false,
      isError: false,
    })
    renderAt('/questionnaires/inst1/results')
    expect(await screen.findByText(/Download PDF/i)).toBeInTheDocument()
  })

  it('hides Download PDF button when not submitted', async () => {
    mockUseQuestionnaire.mockReturnValue({
      data: pendingInstance,
      isLoading: false,
      isError: false,
    })
    renderAt('/questionnaires/inst2/results')
    // Wait for component to render, then confirm no PDF button
    await screen.findByText('Pending')
    expect(screen.queryByText(/Download PDF/i)).not.toBeInTheDocument()
  })

  it('shows "No metrics available" when surveyJson has no calculatedValues', async () => {
    mockUseQuestionnaire.mockReturnValue({
      data: pendingInstance,
      isLoading: false,
      isError: false,
    })
    renderAt('/questionnaires/inst2/results')
    expect(await screen.findByText(/No metrics available/i)).toBeInTheDocument()
  })

  it('renders metric cards when calculatedValues are present', async () => {
    modelState.calcValues = [
      { name: 'totalScore', value: 10 },
      { name: 'bonus_points', value: 42 },
    ]
    mockUseQuestionnaire.mockReturnValue({
      data: submittedInstance,
      isLoading: false,
      isError: false,
    })
    renderAt('/questionnaires/inst1/results')
    expect(await screen.findByText('Total Score')).toBeInTheDocument()
    expect(await screen.findByText('Bonus Points')).toBeInTheDocument()
    expect(await screen.findByText('10')).toBeInTheDocument()
    expect(await screen.findByText('42')).toBeInTheDocument()
  })

  it('shows "—" for null/undefined metric values', async () => {
    // All calc values return null so all cards show —
    modelState.calcValues = [
      { name: 'totalScore', value: null },
      { name: 'bonus_points', value: null },
    ]
    mockUseQuestionnaire.mockReturnValue({
      data: submittedInstance,
      isLoading: false,
      isError: false,
    })
    renderAt('/questionnaires/inst1/results')
    const dashes = await screen.findAllByText('—')
    expect(dashes.length).toBeGreaterThan(0)
  })

  it('clicking Download PDF opens PDF url', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    mockUseQuestionnaire.mockReturnValue({
      data: submittedInstance,
      isLoading: false,
      isError: false,
    })
    renderAt('/questionnaires/inst1/results')
    const btn = await screen.findByText(/Download PDF/i)
    fireEvent.click(btn)
    expect(openSpy).toHaveBeenCalledWith('/api/questionnaires/inst1/pdf/')
  })

  it('uses surveyJsonSnapshot over live surveyJson when snapshot is present', async () => {
    const snapshotJson = {
      pages: [{ elements: [{ type: 'text', name: 'score' }] }],
      calculatedValues: [{ name: 'snap_metric', expression: '{score}' }],
    }
    const liveJson = {
      pages: [{ elements: [{ type: 'text', name: 'score' }] }],
      calculatedValues: [{ name: 'live_metric', expression: '{score}' }],
    }
    modelState.calcValues = [{ name: 'snap_metric', value: 99 }]
    const instanceWithSnapshot: Questionnaire = {
      ...submittedInstance,
      surveyJsonSnapshot: snapshotJson,
      questionnaireType: { ...submittedInstance.questionnaireType!, surveyJson: liveJson },
    }
    mockUseQuestionnaire.mockReturnValue({
      data: instanceWithSnapshot,
      isLoading: false,
      isError: false,
    })
    renderAt('/questionnaires/inst1/results')
    await screen.findByText(/Health Check/)
    expect(modelState.lastConstructorArg).toEqual(snapshotJson)
  })

  it('falls back to live surveyJson when snapshot is absent', async () => {
    const liveJson = {
      pages: [{ elements: [{ type: 'text', name: 'score' }] }],
      calculatedValues: [{ name: 'live_metric', expression: '{score}' }],
    }
    modelState.calcValues = [{ name: 'live_metric', value: 55 }]
    const instanceNoSnapshot: Questionnaire = {
      ...submittedInstance,
      surveyJsonSnapshot: undefined,
      questionnaireType: { ...submittedInstance.questionnaireType!, surveyJson: liveJson },
    }
    mockUseQuestionnaire.mockReturnValue({
      data: instanceNoSnapshot,
      isLoading: false,
      isError: false,
    })
    renderAt('/questionnaires/inst1/results')
    await screen.findByText(/Health Check/)
    expect(modelState.lastConstructorArg).toEqual(liveJson)
  })

  it('renders metrics from stored metrics without instantiating a Model', async () => {
    const instanceWithStoredMetrics: Questionnaire = {
      ...submittedInstance,
      metrics: { totalScore: 99, bonus_points: 7 },
    }
    mockUseQuestionnaire.mockReturnValue({
      data: instanceWithStoredMetrics,
      isLoading: false,
      isError: false,
    })
    renderAt('/questionnaires/inst1/results')
    expect(await screen.findByText('Total Score')).toBeInTheDocument()
    expect(await screen.findByText('99')).toBeInTheDocument()
    expect(await screen.findByText('Bonus Points')).toBeInTheDocument()
    expect(await screen.findByText('7')).toBeInTheDocument()
    // No Model should have been constructed
    expect(modelState.constructorCallCount).toBe(0)
  })

  it('falls back to Model evaluation when stored metrics is empty', async () => {
    modelState.calcValues = [
      { name: 'totalScore', value: 10 },
      { name: 'bonus_points', value: 42 },
    ]
    const instanceEmptyMetrics: Questionnaire = {
      ...submittedInstance,
      metrics: {},
    }
    mockUseQuestionnaire.mockReturnValue({
      data: instanceEmptyMetrics,
      isLoading: false,
      isError: false,
    })
    renderAt('/questionnaires/inst1/results')
    expect(await screen.findByText('Total Score')).toBeInTheDocument()
    expect(modelState.constructorCallCount).toBeGreaterThan(0)
  })
})
