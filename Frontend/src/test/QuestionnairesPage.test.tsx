import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router'
import { routeTree } from '../routeTree.gen'
import type { Questionnaire } from '@/types'

// Mock SurveyJS components that need real DOM/canvas
vi.mock('@/components/survey/SurveyRenderer', () => ({
  SurveyRenderer: () => <div data-testid="survey-renderer">Survey Renderer</div>,
}))
vi.mock('@/components/survey/SurveyDashboard', () => ({
  SurveyDashboard: () => <div data-testid="survey-dashboard">Survey Dashboard</div>,
}))
vi.mock('survey-pdf', () => ({ SurveyPDF: vi.fn() }))

vi.mock('@/hooks/useQuestionnaires', () => ({
  useQuestionnaires: vi.fn(),
  useDeleteQuestionnaire: vi.fn(),
}))

import { useQuestionnaires, useDeleteQuestionnaire } from '@/hooks/useQuestionnaires'

const mockUseQuestionnaires = useQuestionnaires as ReturnType<typeof vi.fn>
const mockUseDeleteQuestionnaire = useDeleteQuestionnaire as ReturnType<typeof vi.fn>

const mockMutate = vi.fn()
const mockDeleteHook = { mutate: mockMutate, isPending: false }

const sampleQuestionnaires: Questionnaire[] = [
  {
    id: '1',
    title: 'Survey Alpha',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    title: 'Survey Beta',
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
  mockUseDeleteQuestionnaire.mockReturnValue(mockDeleteHook)
})

describe('QuestionnairesPage', () => {
  it('shows loading skeletons while data is loading', async () => {
    mockUseQuestionnaires.mockReturnValue({ data: undefined, isLoading: true })
    renderAt('/questionnaires')
    // Wait for router to render the route
    await waitFor(() => {
      const skeletons = document.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  it('shows empty state when no questionnaires exist', async () => {
    mockUseQuestionnaires.mockReturnValue({ data: [], isLoading: false })
    renderAt('/questionnaires')
    expect(await screen.findByText(/no questionnaires yet/i)).toBeInTheDocument()
  })

  it('renders questionnaire titles in the table', async () => {
    mockUseQuestionnaires.mockReturnValue({ data: sampleQuestionnaires, isLoading: false })
    renderAt('/questionnaires')
    expect(await screen.findByText('Survey Alpha')).toBeInTheDocument()
    expect(screen.getByText('Survey Beta')).toBeInTheDocument()
  })

  it('shows the delete confirmation dialog when Delete is clicked', async () => {
    mockUseQuestionnaires.mockReturnValue({ data: sampleQuestionnaires, isLoading: false })
    renderAt('/questionnaires')
    const deleteButtons = await screen.findAllByRole('button', { name: /delete/i })
    fireEvent.click(deleteButtons[0])
    expect(screen.getByText(/delete questionnaire\?/i)).toBeInTheDocument()
  })

  it('closes the confirmation dialog on Cancel', async () => {
    mockUseQuestionnaires.mockReturnValue({ data: sampleQuestionnaires, isLoading: false })
    renderAt('/questionnaires')
    const [firstDelete] = await screen.findAllByRole('button', { name: /delete/i })
    fireEvent.click(firstDelete)
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)
    expect(screen.queryByText(/delete questionnaire\?/i)).not.toBeInTheDocument()
  })

  it('calls delete mutate with the questionnaire id on confirm', async () => {
    mockUseQuestionnaires.mockReturnValue({ data: sampleQuestionnaires, isLoading: false })
    renderAt('/questionnaires')
    const [firstDelete] = await screen.findAllByRole('button', { name: /delete/i })
    fireEvent.click(firstDelete)
    // Click the confirm Delete button inside the dialog
    const confirmButton = screen.getAllByRole('button', { name: /delete/i }).at(-1)!
    fireEvent.click(confirmButton)
    await waitFor(() => expect(mockMutate).toHaveBeenCalledWith('1', expect.any(Object)))
  })

  it('has a + New Questionnaire link', async () => {
    mockUseQuestionnaires.mockReturnValue({ data: [], isLoading: false })
    renderAt('/questionnaires')
    expect(await screen.findByRole('link', { name: /new questionnaire/i })).toBeInTheDocument()
  })
})
