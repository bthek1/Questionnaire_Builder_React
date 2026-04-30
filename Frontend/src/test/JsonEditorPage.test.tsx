import { render, screen, fireEvent } from '@testing-library/react'
import { vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router'
import { routeTree } from '../routeTree.gen'
import type { QuestionnaireType } from '@/types'

vi.mock('@/components/survey/SurveyRenderer', () => ({
  SurveyRenderer: ({ surveyJson }: { surveyJson: object }) => (
    <div data-testid="survey-renderer">{JSON.stringify(surveyJson)}</div>
  ),
}))
vi.mock('@/hooks/useQuestionnaireTypes', () => ({
  useQuestionnaireType: vi.fn(),
  useQuestionnaireTypes: vi.fn(),
  useCreateQuestionnaireType: vi.fn(),
  useDeleteQuestionnaireType: vi.fn(),
  useUpdateQuestionnaireType: vi.fn(),
}))
vi.mock('@/hooks/useQuestionnaires', () => ({
  useQuestionnaire: vi.fn(),
  useQuestionnaires: vi.fn(),
  useCreateQuestionnaire: vi.fn(),
  useDeleteQuestionnaire: vi.fn(),
  useSubmitAnswers: vi.fn(),
}))

import {
  useQuestionnaireType,
  useQuestionnaireTypes,
  useCreateQuestionnaireType,
  useDeleteQuestionnaireType,
  useUpdateQuestionnaireType,
} from '@/hooks/useQuestionnaireTypes'
import {
  useQuestionnaire,
  useQuestionnaires,
  useCreateQuestionnaire,
  useDeleteQuestionnaire,
} from '@/hooks/useQuestionnaires'

const mockUseQuestionnaire = useQuestionnaireType as ReturnType<typeof vi.fn>
const mockUseQuestionnaires = useQuestionnaireTypes as ReturnType<typeof vi.fn>
const mockUseCreateQuestionnaire = useCreateQuestionnaireType as ReturnType<typeof vi.fn>
const mockUseDeleteQuestionnaire = useDeleteQuestionnaireType as ReturnType<typeof vi.fn>
const mockUseUpdateQuestionnaire = useUpdateQuestionnaireType as ReturnType<typeof vi.fn>
const mockUseQuestionnaireInst = useQuestionnaire as ReturnType<typeof vi.fn>
const mockUseQuestionnairesInst = useQuestionnaires as ReturnType<typeof vi.fn>
const mockUseCreateQuestionnairesInst = useCreateQuestionnaire as ReturnType<typeof vi.fn>
const mockUseDeleteQuestionnairesInst = useDeleteQuestionnaire as ReturnType<typeof vi.fn>

const testQuestionnaire: QuestionnaireType = {
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
  mockUseQuestionnaireInst.mockReturnValue({ data: undefined, isLoading: false })
  mockUseQuestionnairesInst.mockReturnValue({ data: [], isLoading: false })
  mockUseCreateQuestionnairesInst.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false })
  mockUseDeleteQuestionnairesInst.mockReturnValue({ mutate: vi.fn(), isPending: false })
})

describe('JsonEditorPage', () => {
  it('renders textarea pre-filled with existing surveyJson', async () => {
    renderAt('/questionnaire-types/q1/json')
    const textarea = (await screen.findByRole('textbox')) as HTMLTextAreaElement
    expect(textarea.value).toContain('"pages"')
  })

  it('disables Save when JSON is invalid', async () => {
    renderAt('/questionnaire-types/q1/json')
    const textarea = await screen.findByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'not json' } })
    const saveBtn = screen.getByRole('button', { name: /save/i })
    expect(saveBtn).toBeDisabled()
  })

  it('calls updateQuestionnaire with parsed JSON on valid save', async () => {
    renderAt('/questionnaire-types/q1/json')
    const saveBtn = await screen.findByRole('button', { name: /save/i })
    fireEvent.click(saveBtn)
    expect(mockMutate).toHaveBeenCalledWith({ surveyJson: { pages: [] } }, expect.any(Object))
  })

  it('renders the preview panel on load with the saved surveyJson', async () => {
    renderAt('/questionnaire-types/q1/json')
    const preview = await screen.findByTestId('survey-renderer')
    expect(preview).toBeInTheDocument()
    expect(preview.textContent).toContain('pages')
  })

  it('updates the preview when valid JSON is typed', async () => {
    renderAt('/questionnaire-types/q1/json')
    const textarea = await screen.findByRole('textbox')
    const newJson = JSON.stringify({ pages: [{ name: 'p1' }] }, null, 2)
    fireEvent.change(textarea, { target: { value: newJson } })
    const preview = screen.getByTestId('survey-renderer')
    expect(preview.textContent).toContain('p1')
  })

  it('retains the last valid preview when invalid JSON is typed', async () => {
    renderAt('/questionnaire-types/q1/json')
    const textarea = await screen.findByRole('textbox')
    const validJson = JSON.stringify({ pages: [{ name: 'before' }] }, null, 2)
    fireEvent.change(textarea, { target: { value: validJson } })
    fireEvent.change(textarea, { target: { value: 'not json' } })
    const preview = screen.getByTestId('survey-renderer')
    expect(preview.textContent).toContain('before')
  })
})
