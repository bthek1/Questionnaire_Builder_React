import { render, screen } from '@testing-library/react'
import { vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router'
import { routeTree } from '../routeTree.gen'
import type { Questionnaire } from '@/types'

vi.mock('@/components/survey/SurveyDashboard', () => ({
  SurveyDashboard: () => <div data-testid="survey-dashboard">Survey Dashboard</div>,
}))
vi.mock('survey-pdf', () => ({ SurveyPDF: vi.fn() }))

vi.mock('@/hooks/useQuestionnaires', () => ({
  useQuestionnaire: vi.fn(),
  useQuestionnaires: vi.fn(),
  useCreateQuestionnaire: vi.fn(),
  useDeleteQuestionnaire: vi.fn(),
  useUpdateQuestionnaire: vi.fn(),
}))
vi.mock('@/hooks/useResponses', () => ({
  useSubmitResponse: vi.fn(),
  useResponses: vi.fn(),
}))

import {
  useQuestionnaire,
  useQuestionnaires,
  useCreateQuestionnaire,
  useDeleteQuestionnaire,
  useUpdateQuestionnaire,
} from '@/hooks/useQuestionnaires'
import { useSubmitResponse, useResponses } from '@/hooks/useResponses'

const mockUseQuestionnaire = useQuestionnaire as ReturnType<typeof vi.fn>
const mockUseQuestionnaires = useQuestionnaires as ReturnType<typeof vi.fn>
const mockUseCreateQuestionnaire = useCreateQuestionnaire as ReturnType<typeof vi.fn>
const mockUseDeleteQuestionnaire = useDeleteQuestionnaire as ReturnType<typeof vi.fn>
const mockUseUpdateQuestionnaire = useUpdateQuestionnaire as ReturnType<typeof vi.fn>
const mockUseSubmitResponse = useSubmitResponse as ReturnType<typeof vi.fn>
const mockUseResponses = useResponses as ReturnType<typeof vi.fn>

const questionnaires: Questionnaire[] = [
  { id: 'abc123', title: 'Survey A', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'def456', title: 'Survey B', createdAt: '2024-01-02T00:00:00Z', updatedAt: '2024-01-02T00:00:00Z' },
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
  mockUseQuestionnaire.mockReturnValue({ data: undefined, isLoading: false })
  mockUseQuestionnaires.mockReturnValue({ data: questionnaires, isLoading: false })
  mockUseCreateQuestionnaire.mockReturnValue({ mutateAsync: vi.fn(), isPending: false, isError: false })
  mockUseDeleteQuestionnaire.mockReturnValue({ mutate: vi.fn(), isPending: false })
  mockUseUpdateQuestionnaire.mockReturnValue({ mutate: vi.fn(), isPending: false })
  mockUseSubmitResponse.mockReturnValue({ mutateAsync: vi.fn(), isPending: false })
  mockUseResponses.mockReturnValue({ data: [], isLoading: false })
})

describe('ShareLinksPage', () => {
  it('renders a row per questionnaire', async () => {
    renderAt('/questionnaires/share')
    expect(await screen.findByText('Survey A')).toBeInTheDocument()
    expect(screen.getByText('Survey B')).toBeInTheDocument()
  })

  it('shows respondent URLs containing the questionnaire id', async () => {
    renderAt('/questionnaires/share')
    await screen.findByText('Survey A')
    expect(screen.getByText(/\/take\/abc123/)).toBeInTheDocument()
    expect(screen.getByText(/\/take\/def456/)).toBeInTheDocument()
  })
})
