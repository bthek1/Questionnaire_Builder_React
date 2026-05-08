import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router'
import { routeTree } from '../routeTree.gen'

vi.mock('@/hooks/useBatteryTypes', () => ({
  useBatteryTypes: vi.fn(),
  useCreateBatteryType: vi.fn(),
  useDeleteBatteryType: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useUpdateBatteryType: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
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

import { useBatteryTypes, useCreateBatteryType } from '@/hooks/useBatteryTypes'

const mockUseBatteryTypes = useBatteryTypes as ReturnType<typeof vi.fn>
const mockUseCreateBatteryType = useCreateBatteryType as ReturnType<typeof vi.fn>

const mockMutate = vi.fn()

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
  mockUseBatteryTypes.mockReturnValue({ data: [], isLoading: false })
  mockUseCreateBatteryType.mockReturnValue({ mutate: mockMutate, isPending: false, isError: false })
})

describe('NewBatteryTypePage', () => {
  it('renders the create form', async () => {
    renderAt('/battery-types/new')
    await screen.findByRole('heading', { name: /new battery type/i })
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
  })

  it('submits with title and navigates on success', async () => {
    renderAt('/battery-types/new')
    await screen.findByRole('heading', { name: /new battery type/i })
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'My Battery Type' } })
    fireEvent.click(screen.getByRole('button', { name: /create/i }))
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'My Battery Type' }),
        expect.any(Object),
      )
    })
  })

  it('shows error when mutate fails', async () => {
    mockUseCreateBatteryType.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: true,
    })
    renderAt('/battery-types/new')
    await screen.findByRole('heading', { name: /new battery type/i })
    await screen.findByText(/failed to create/i)
  })
})

describe('NewBatteryPage', () => {
  it('renders the deploy form', async () => {
    const { useCreateBattery } = await import('@/hooks/useBatteries')
    ;(useCreateBattery as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    })
    renderAt('/batteries/new')
    await screen.findByRole('heading', { name: /new battery/i })
    expect(screen.getByLabelText(/battery type/i)).toBeInTheDocument()
  })
})
