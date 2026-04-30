import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router'
import { routeTree } from '../routeTree.gen'
import type { QuestionnaireType } from '@/types'

vi.mock('@/components/survey/SurveyRenderer', () => ({
  SurveyRenderer: () => <div data-testid="survey-renderer">Survey Renderer</div>,
}))

vi.mock('@/hooks/useQuestionnaires', () => ({
  useCreateQuestionnaireType: vi.fn(),
  useQuestionnaireType: vi.fn(),
  useQuestionnaireTypes: vi.fn(),
  useDeleteQuestionnaireType: vi.fn(),
  useUpdateQuestionnaireType: vi.fn(),
}))

import {
  useCreateQuestionnaireType,
  useQuestionnaireType,
  useQuestionnaireTypes,
  useDeleteQuestionnaireType,
} from '@/hooks/useQuestionnaires'

const mockUseCreateQuestionnaire = useCreateQuestionnaireType as ReturnType<typeof vi.fn>
const mockUseQuestionnaire = useQuestionnaireType as ReturnType<typeof vi.fn>
const mockUseQuestionnaires = useQuestionnaireTypes as ReturnType<typeof vi.fn>
const mockUseDeleteQuestionnaire = useDeleteQuestionnaireType as ReturnType<typeof vi.fn>

const createdQuestionnaire: QuestionnaireType = {
  id: 'new-id',
  title: 'My New Survey',
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
  mockUseDeleteQuestionnaire.mockReturnValue({ mutate: vi.fn(), isPending: false })
  mockUseQuestionnaire.mockReturnValue({
    data: createdQuestionnaire,
    isLoading: false,
    isError: false,
  })
})

describe('NewQuestionnairePage', () => {
  it('renders the heading', async () => {
    mockUseCreateQuestionnaire.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      isError: false,
    })
    renderAt('/questionnaires/new')
    expect(await screen.findByRole('heading', { name: /new questionnaire/i })).toBeInTheDocument()
  })

  it('shows a validation error when title is empty', async () => {
    mockUseCreateQuestionnaire.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      isError: false,
    })
    renderAt('/questionnaires/new')
    const submitButton = await screen.findByRole('button', { name: /create/i })
    fireEvent.click(submitButton)
    expect(await screen.findByText(/title is required/i)).toBeInTheDocument()
  })

  it('does not call mutateAsync when title is empty', async () => {
    const mutateAsync = vi.fn()
    mockUseCreateQuestionnaire.mockReturnValue({ mutateAsync, isPending: false, isError: false })
    renderAt('/questionnaires/new')
    fireEvent.click(await screen.findByRole('button', { name: /create/i }))
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  it('calls mutateAsync with title and description when form is submitted', async () => {
    const mutateAsync = vi.fn().mockResolvedValueOnce(createdQuestionnaire)
    mockUseCreateQuestionnaire.mockReturnValue({ mutateAsync, isPending: false, isError: false })
    renderAt('/questionnaires/new')

    await userEvent.type(await screen.findByLabelText(/title/i), 'My New Survey')
    await userEvent.type(screen.getByLabelText(/description/i), 'An optional description')
    fireEvent.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'My New Survey',
          description: 'An optional description',
        }),
      ),
    )
  })

  it('shows a loading button label while creating', async () => {
    mockUseCreateQuestionnaire.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: true,
      isError: false,
    })
    renderAt('/questionnaires/new')
    expect(await screen.findByRole('button', { name: /creating/i })).toBeDisabled()
  })

  it('shows an error message when creation fails', async () => {
    mockUseCreateQuestionnaire.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      isError: true,
      error: new Error('Server error'),
    })
    renderAt('/questionnaires/new')
    expect(await screen.findByText(/failed to create questionnaire/i)).toBeInTheDocument()
  })
})
