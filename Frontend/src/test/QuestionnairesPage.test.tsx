import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router'
import { routeTree } from '../routeTree.gen'
import type { Questionnaire } from '@/types'

vi.mock('@/components/survey/SurveyRenderer', () => ({
  SurveyRenderer: () => <div data-testid="survey-renderer">Survey Renderer</div>,
}))

vi.mock('@/hooks/useQuestionnaires', () => ({
  useQuestionnaires: vi.fn(),
  useDeleteQuestionnaire: vi.fn(),
  useCreateQuestionnaire: vi.fn(),
}))

vi.mock('@/hooks/useQuestionnaireTypes', () => ({
  useQuestionnaireTypes: vi.fn().mockReturnValue({ data: [], isLoading: false }),
  useCreateQuestionnaireType: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useDeleteQuestionnaireType: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useUpdateQuestionnaireType: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
}))

import { useQuestionnaires, useDeleteQuestionnaire, useCreateQuestionnaire } from '@/hooks/useQuestionnaires'

const mockUseQuestionnaires = useQuestionnaires as ReturnType<typeof vi.fn>
const mockUseDeleteQuestionnaire = useDeleteQuestionnaire as ReturnType<typeof vi.fn>
const mockUseCreateQuestionnaire = useCreateQuestionnaire as ReturnType<typeof vi.fn>

const mockMutate = vi.fn()
const mockDeleteHook = { mutate: mockMutate, isPending: false }

const sampleInstances: Questionnaire[] = [
  {
    id: '1',
    questionnaireTypeId: 'qt1',
    questionnaireType: { id: 'qt1', title: 'Survey Alpha', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
    name: 'Alpha Deployment',
    shareToken: 'token-1',
    answers: {},
    submittedAt: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    questionnaireTypeId: 'qt2',
    questionnaireType: { id: 'qt2', title: 'Survey Beta', createdAt: '2024-02-01T00:00:00Z', updatedAt: '2024-02-01T00:00:00Z' },
    name: '',
    shareToken: 'token-2',
    answers: { q1: 'yes' },
    submittedAt: '2024-02-02T00:00:00Z',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-02T00:00:00Z',
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
  mockUseCreateQuestionnaire.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false })
})

describe('QuestionnairesPage', () => {
  it('shows loading skeletons while data is loading', async () => {
    mockUseQuestionnaires.mockReturnValue({ data: undefined, isLoading: true })
    renderAt('/questionnaires')
    await waitFor(() => {
      const skeletons = document.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  it('shows empty state when no instances exist', async () => {
    mockUseQuestionnaires.mockReturnValue({ data: [], isLoading: false })
    renderAt('/questionnaires')
    expect(await screen.findByText(/no questionnaires deployed yet/i)).toBeInTheDocument()
  })

  it('renders questionnaire type titles in the table', async () => {
    mockUseQuestionnaires.mockReturnValue({ data: sampleInstances, isLoading: false })
    renderAt('/questionnaires')
    expect(await screen.findByText('Survey Alpha')).toBeInTheDocument()
    expect(screen.getByText('Survey Beta')).toBeInTheDocument()
  })

  it('shows Submitted status badge for submitted instances', async () => {
    mockUseQuestionnaires.mockReturnValue({ data: sampleInstances, isLoading: false })
    renderAt('/questionnaires')
    expect(await screen.findByText('Submitted')).toBeInTheDocument()
  })

  it('shows Pending status badge for unsubmitted instances', async () => {
    mockUseQuestionnaires.mockReturnValue({ data: sampleInstances, isLoading: false })
    renderAt('/questionnaires')
    expect(await screen.findByText('Pending')).toBeInTheDocument()
  })

  it('shows the delete confirmation dialog when Delete is clicked', async () => {
    mockUseQuestionnaires.mockReturnValue({ data: sampleInstances, isLoading: false })
    renderAt('/questionnaires')
    const deleteButtons = await screen.findAllByRole('button', { name: /delete/i })
    fireEvent.click(deleteButtons[0])
    expect(screen.getByText(/delete deployment\?/i)).toBeInTheDocument()
  })

  it('closes the confirmation dialog on Cancel', async () => {
    mockUseQuestionnaires.mockReturnValue({ data: sampleInstances, isLoading: false })
    renderAt('/questionnaires')
    const [firstDelete] = await screen.findAllByRole('button', { name: /delete/i })
    fireEvent.click(firstDelete)
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)
    expect(screen.queryByText(/delete deployment\?/i)).not.toBeInTheDocument()
  })

  it('calls delete mutate with the instance id on confirm', async () => {
    mockUseQuestionnaires.mockReturnValue({ data: sampleInstances, isLoading: false })
    renderAt('/questionnaires')
    const [firstDelete] = await screen.findAllByRole('button', { name: /delete/i })
    fireEvent.click(firstDelete)
    const confirmButton = screen.getAllByRole('button', { name: /delete/i }).at(-1)!
    fireEvent.click(confirmButton)
    await waitFor(() => expect(mockMutate).toHaveBeenCalledWith('1', expect.any(Object)))
  })

  it('has a + New Deployment link', async () => {
    mockUseQuestionnaires.mockReturnValue({ data: [], isLoading: false })
    renderAt('/questionnaires')
    expect(await screen.findByRole('link', { name: /new deployment/i })).toBeInTheDocument()
  })
})
