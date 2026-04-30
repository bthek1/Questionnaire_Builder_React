import { render, screen, fireEvent } from '@testing-library/react'
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

const testQuestionnaire: Questionnaire = {
  id: 'q1',
  title: 'My Test Survey',
  surveyJson: { pages: [] },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

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
  mockUseQuestionnaire.mockReturnValue({ data: testQuestionnaire, isLoading: false })
  mockUseQuestionnaires.mockReturnValue({ data: [], isLoading: false })
  mockUseCreateQuestionnaire.mockReturnValue({ mutateAsync: vi.fn(), isPending: false, isError: false })
  mockUseDeleteQuestionnaire.mockReturnValue({ mutate: vi.fn(), isPending: false })
  mockUseUpdateQuestionnaire.mockReturnValue({ mutate: mockMutate, isPending: false })
  mockUseSubmitResponse.mockReturnValue({ mutateAsync: vi.fn(), isPending: false })
  mockUseResponses.mockReturnValue({ data: [], isLoading: false })
})

describe('JsonEditorPage', () => {
  it('renders textarea pre-filled with existing surveyJson', async () => {
    renderAt('/questionnaires/q1/json')
    const textarea = await screen.findByRole('textbox') as HTMLTextAreaElement
    expect(textarea.value).toContain('"pages"')
  })

  it('disables Save when JSON is invalid', async () => {
    renderAt('/questionnaires/q1/json')
    const textarea = await screen.findByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'not json' } })
    const saveBtn = screen.getByRole('button', { name: /save/i })
    expect(saveBtn).toBeDisabled()
  })

  it('calls updateQuestionnaire with parsed JSON on valid save', async () => {
    renderAt('/questionnaires/q1/json')
    const saveBtn = await screen.findByRole('button', { name: /save/i })
    fireEvent.click(saveBtn)
    expect(mockMutate).toHaveBeenCalledWith(
      { surveyJson: { pages: [] } },
      expect.any(Object),
    )
  })
})
