import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router'
import { routeTree } from '../routeTree.gen'
import type { BatteryType } from '@/types'

vi.mock('@/hooks/useBatteryTypes', () => ({
  useBatteryTypes: vi.fn(),
  useDeleteBatteryType: vi.fn(),
  useCreateBatteryType: vi
    .fn()
    .mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false }),
  useUpdateBatteryType: vi
    .fn()
    .mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false }),
  useBatteryType: vi.fn().mockReturnValue({ data: undefined, isLoading: false }),
}))

vi.mock('@/hooks/useBatteries', () => ({
  useBatteries: vi.fn().mockReturnValue({ data: [], isLoading: false }),
  useDeleteBattery: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useCreateBattery: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false }),
  useBattery: vi.fn().mockReturnValue({ data: undefined, isLoading: false }),
  useBatteryByToken: vi.fn().mockReturnValue({ data: undefined, isLoading: false }),
}))

vi.mock('@/hooks/useQuestionnaireTypes', () => ({
  useQuestionnaireTypes: vi.fn().mockReturnValue({ data: [], isLoading: false }),
  useCreateQuestionnaireType: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useDeleteQuestionnaireType: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useUpdateQuestionnaireType: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useBatteryType: vi.fn().mockReturnValue({ data: undefined, isLoading: false }),
}))

vi.mock('@/hooks/useQuestionnaires', () => ({
  useQuestionnaires: vi.fn().mockReturnValue({ data: [], isLoading: false }),
  useDeleteQuestionnaire: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useCreateQuestionnaire: vi
    .fn()
    .mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false }),
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

import { useBatteryTypes, useDeleteBatteryType } from '@/hooks/useBatteryTypes'

const mockUseBatteryTypes = useBatteryTypes as ReturnType<typeof vi.fn>
const mockUseDeleteBatteryType = useDeleteBatteryType as ReturnType<typeof vi.fn>

const mockMutate = vi.fn()

const sampleTypes: BatteryType[] = [
  {
    id: 'bt1',
    title: 'Stress Battery',
    description: 'Measures stress',
    questionnaireTypeIds: ['qt1', 'qt2'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'bt2',
    title: 'Wellness Battery',
    questionnaireTypeIds: [],
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
  mockUseDeleteBatteryType.mockReturnValue({ mutate: mockMutate, isPending: false })
})

describe('BatteryTypesPage', () => {
  it('shows loading skeletons while loading', async () => {
    mockUseBatteryTypes.mockReturnValue({ data: undefined, isLoading: true })
    renderAt('/battery-types')
    await waitFor(() => {
      expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
    })
  })

  it('shows empty state when no battery types', async () => {
    mockUseBatteryTypes.mockReturnValue({ data: [], isLoading: false })
    renderAt('/battery-types')
    await screen.findByText(/no battery types yet/i)
  })

  it('renders battery types list', async () => {
    mockUseBatteryTypes.mockReturnValue({ data: sampleTypes, isLoading: false })
    renderAt('/battery-types')
    await screen.findByText('Stress Battery')
    expect(screen.getByText('Wellness Battery')).toBeInTheDocument()
  })

  it('shows delete confirmation modal and calls delete', async () => {
    mockUseBatteryTypes.mockReturnValue({ data: sampleTypes, isLoading: false })
    renderAt('/battery-types')
    await screen.findByText('Stress Battery')
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    fireEvent.click(deleteButtons[0])
    await screen.findByText(/delete battery type/i)
    const confirmBtn = screen.getAllByRole('button', { name: /^delete$/i }).at(-1)!
    fireEvent.click(confirmBtn)
    expect(mockMutate).toHaveBeenCalledWith('bt1', expect.any(Object))
  })

  it('cancels delete when Cancel clicked', async () => {
    mockUseBatteryTypes.mockReturnValue({ data: sampleTypes, isLoading: false })
    renderAt('/battery-types')
    await screen.findByText('Stress Battery')
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    fireEvent.click(deleteButtons[0])
    await screen.findByText(/delete battery type/i)
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByText(/delete battery type/i)).not.toBeInTheDocument()
  })
})
