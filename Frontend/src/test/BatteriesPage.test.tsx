import { render, screen, waitFor } from '@testing-library/react'
import { vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router'
import { routeTree } from '../routeTree.gen'
import type { Battery } from '@/types'

vi.mock('@/hooks/useBatteries', () => ({
  useBatteries: vi.fn(),
  useDeleteBattery: vi.fn(),
  useCreateBattery: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false }),
  useBattery: vi.fn().mockReturnValue({ data: undefined, isLoading: false }),
  useBatteryByToken: vi.fn().mockReturnValue({ data: undefined, isLoading: false }),
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
  useQuestionnaireByToken: vi.fn().mockReturnValue({ data: undefined, isLoading: false }),
  useSubmitAnswers: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useUpdateQuestionnaire: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@/components/survey/SurveyRenderer', () => ({
  SurveyRenderer: () => <div data-testid="survey-renderer">Survey Renderer</div>,
  SURVEY_THEMES: {},
}))

vi.mock('@/components/survey/SurveyDashboard', () => ({
  SurveyDashboard: () => <div>Dashboard</div>,
}))

import { useBatteries, useDeleteBattery } from '@/hooks/useBatteries'

const mockUseBatteries = useBatteries as ReturnType<typeof vi.fn>
const mockUseDeleteBattery = useDeleteBattery as ReturnType<typeof vi.fn>

const mockMutate = vi.fn()

const sampleBatteries: Battery[] = [
  {
    id: 'b1',
    batteryTypeId: 'bt1',
    batteryTypeName: 'Stress Battery',
    name: 'Cohort A',
    shareToken: 'share-abc',
    questionnaires: [
      {
        order: 0,
        questionnaireId: 'q1',
        shareToken: 'q-tok-1',
        questionnaireTypeName: 'Survey 1',
        submittedAt: '2024-01-02T00:00:00Z',
      },
      {
        order: 1,
        questionnaireId: 'q2',
        shareToken: 'q-tok-2',
        questionnaireTypeName: 'Survey 2',
        submittedAt: '2024-01-02T00:00:00Z',
      },
    ],
    isComplete: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'b2',
    batteryTypeId: 'bt1',
    batteryTypeName: 'Stress Battery',
    name: '',
    shareToken: 'share-def',
    questionnaires: [],
    isComplete: false,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  },
]

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
  mockUseDeleteBattery.mockReturnValue({ mutate: mockMutate, isPending: false })
})

describe('BatteriesPage', () => {
  it('shows loading skeletons while loading', async () => {
    mockUseBatteries.mockReturnValue({ data: undefined, isLoading: true })
    renderAt('/batteries')
    await waitFor(() => {
      expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
    })
  })

  it('shows empty state when no batteries', async () => {
    mockUseBatteries.mockReturnValue({ data: [], isLoading: false })
    renderAt('/batteries')
    await screen.findByText(/no batteries deployed yet/i)
  })

  it('renders battery list with names and status badges', async () => {
    mockUseBatteries.mockReturnValue({ data: sampleBatteries, isLoading: false })
    renderAt('/batteries')
    await screen.findByText('Cohort A')
    expect(screen.getByText('Complete')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('shows type sidebar', async () => {
    const { useBatteryTypes } = await import('@/hooks/useBatteryTypes')
    ;(useBatteryTypes as ReturnType<typeof vi.fn>).mockReturnValue({
      data: [
        {
          id: 'bt1',
          title: 'Stress Battery',
          questionnaireTypeIds: [],
          createdAt: '',
          updatedAt: '',
        },
      ],
      isLoading: false,
    })
    mockUseBatteries.mockReturnValue({ data: sampleBatteries, isLoading: false })
    renderAt('/batteries')
    await screen.findByText('All types')
    expect(screen.getAllByText('Stress Battery').length).toBeGreaterThan(0)
  })
})
