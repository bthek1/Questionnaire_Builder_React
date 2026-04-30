import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { QuestionnaireForm } from '../components/questionnaire/QuestionnaireForm'

vi.mock('../api/questionnaires', () => ({
  createQuestionnaire: vi.fn(),
}))

import { createQuestionnaire } from '../api/questionnaires'

function renderForm() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <QuestionnaireForm />
    </QueryClientProvider>,
  )
}

describe('QuestionnaireForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders title and description fields', () => {
    renderForm()
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
  })

  it('renders empty questions state', () => {
    renderForm()
    expect(screen.getByText(/no questions yet/i)).toBeInTheDocument()
  })

  it('adds a question when "Add Question" is clicked', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByRole('button', { name: /add question/i }))
    expect(screen.getByLabelText(/question text/i)).toBeInTheDocument()
    expect(screen.getByText(/question 1/i)).toBeInTheDocument()
  })

  it('removes a question when the remove button is clicked', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByRole('button', { name: /add question/i }))
    expect(screen.getByText(/question 1/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /remove question/i }))
    expect(screen.getByText(/no questions yet/i)).toBeInTheDocument()
  })

  it('shows validation error when title is cleared after typing', async () => {
    const user = userEvent.setup()
    renderForm()
    const titleInput = screen.getByLabelText(/title \*/i)
    await user.type(titleInput, 'a')
    await user.clear(titleInput)
    await waitFor(() => {
      expect(screen.getByText(/this field is required/i)).toBeInTheDocument()
    })
  })

  it('shows validation error when title is too short', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.type(screen.getByLabelText(/title \*/i), 'ab')
    await waitFor(() => {
      expect(screen.getByText(/must be at least 3 characters/i)).toBeInTheDocument()
    })
  })

  it('submits successfully with valid data', async () => {
    const mockCreate = vi.mocked(createQuestionnaire)
    mockCreate.mockResolvedValueOnce({
      id: '1',
      title: 'My Survey',
      questions: [],
      createdAt: '',
      updatedAt: '',
    })

    const user = userEvent.setup()
    renderForm()
    await user.type(screen.getByLabelText(/title \*/i), 'My Survey')
    await user.click(screen.getByRole('button', { name: /create questionnaire/i }))

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled()
      expect(mockCreate.mock.calls[0][0]).toEqual(
        expect.objectContaining({ title: 'My Survey' }),
      )
    })
  })
})
