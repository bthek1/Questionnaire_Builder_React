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
  mockUseCreateQuestionnaire.mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
  })
  mockUseDeleteQuestionnaire.mockReturnValue({ mutate: vi.fn(), isPending: false })
  mockUseUpdateQuestionnaire.mockReturnValue({ mutate: mockMutate, isPending: false })
  mockUseQuestionnaireInst.mockReturnValue({ data: undefined, isLoading: false })
  mockUseQuestionnairesInst.mockReturnValue({ data: [], isLoading: false })
  mockUseCreateQuestionnairesInst.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
  })
  mockUseDeleteQuestionnairesInst.mockReturnValue({ mutate: vi.fn(), isPending: false })
})

describe('JsonEditorPage', () => {
  it('renders textarea pre-filled with existing surveyJson (JSON mode)', async () => {
    renderAt('/questionnaire-types/q1/json')
    // Switch to JSON mode first — page defaults to Visual
    const toggle = await screen.findByTestId('editor-mode-toggle')
    fireEvent.click(toggle.querySelector('button:last-child')!)
    const textarea = (await screen.findByRole('textbox', { name: '' })) as HTMLTextAreaElement
    expect(textarea.value).toContain('"pages"')
  })

  it('disables Save when JSON is invalid', async () => {
    renderAt('/questionnaire-types/q1/json')
    const toggle = await screen.findByTestId('editor-mode-toggle')
    fireEvent.click(toggle.querySelector('button:last-child')!)
    const textarea = screen.getByRole('textbox', { name: '' }) as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: 'not json' } })
    const saveBtns = screen.getAllByRole('button', { name: /^save$/i })
    // The main Save button (not the rename form one)
    const saveBtn = saveBtns[saveBtns.length - 1]
    expect(saveBtn).toBeDisabled()
  })

  it('calls updateQuestionnaire with parsed JSON on valid save (JSON mode)', async () => {
    renderAt('/questionnaire-types/q1/json')
    const toggle = await screen.findByTestId('editor-mode-toggle')
    fireEvent.click(toggle.querySelector('button:last-child')!)
    const saveBtns = screen.getAllByRole('button', { name: /^save$/i })
    fireEvent.click(saveBtns[saveBtns.length - 1])
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ surveyJson: expect.any(Object) }),
      expect.any(Object),
    )
  })

  it('renders the preview panel on load with the saved surveyJson', async () => {
    renderAt('/questionnaire-types/q1/json')
    const preview = await screen.findByTestId('survey-renderer')
    expect(preview).toBeInTheDocument()
    expect(preview.textContent).toContain('pages')
  })

  it('updates the preview when valid JSON is typed (JSON mode)', async () => {
    renderAt('/questionnaire-types/q1/json')
    const toggle = await screen.findByTestId('editor-mode-toggle')
    fireEvent.click(toggle.querySelector('button:last-child')!)
    const textarea = screen.getByRole('textbox', { name: '' }) as HTMLTextAreaElement
    const newJson = JSON.stringify({ pages: [{ name: 'p1' }] }, null, 2)
    fireEvent.change(textarea, { target: { value: newJson } })
    const preview = screen.getByTestId('survey-renderer')
    expect(preview.textContent).toContain('p1')
  })

  it('retains the last valid preview when invalid JSON is typed (JSON mode)', async () => {
    renderAt('/questionnaire-types/q1/json')
    const toggle = await screen.findByTestId('editor-mode-toggle')
    fireEvent.click(toggle.querySelector('button:last-child')!)
    const textarea = screen.getByRole('textbox', { name: '' }) as HTMLTextAreaElement
    const validJson = JSON.stringify({ pages: [{ name: 'before' }] }, null, 2)
    fireEvent.change(textarea, { target: { value: validJson } })
    fireEvent.change(textarea, { target: { value: 'not json' } })
    const preview = screen.getByTestId('survey-renderer')
    expect(preview.textContent).toContain('before')
  })

  // ---- Toggle tests ----

  it('renders the mode toggle with Visual and JSON labels', async () => {
    renderAt('/questionnaire-types/q1/json')
    const toggle = await screen.findByTestId('editor-mode-toggle')
    expect(toggle).toBeInTheDocument()
    expect(toggle.textContent).toContain('Visual')
    expect(toggle.textContent).toContain('JSON')
  })

  it('defaults to Visual mode (no textarea visible)', async () => {
    renderAt('/questionnaire-types/q1/json')
    await screen.findByTestId('editor-mode-toggle')
    // textarea should not be present in visual mode
    expect(screen.queryByRole('textbox', { name: '' })).not.toBeInTheDocument()
  })

  it('switching to JSON mode shows the textarea', async () => {
    renderAt('/questionnaire-types/q1/json')
    const toggle = await screen.findByTestId('editor-mode-toggle')
    fireEvent.click(toggle.querySelector('button:last-child')!)
    expect(screen.getByRole('textbox', { name: '' })).toBeInTheDocument()
  })

  it('switching back to Visual mode hides the textarea', async () => {
    renderAt('/questionnaire-types/q1/json')
    const toggle = await screen.findByTestId('editor-mode-toggle')
    // go to JSON
    fireEvent.click(toggle.querySelector('button:last-child')!)
    expect(screen.getByRole('textbox', { name: '' })).toBeInTheDocument()
    // back to Visual
    fireEvent.click(toggle.querySelector('button:first-child')!)
    expect(screen.queryByRole('textbox', { name: '' })).not.toBeInTheDocument()
  })

  it('invalid JSON in JSON mode: switching to Visual shows an error banner', async () => {
    renderAt('/questionnaire-types/q1/json')
    const toggle = await screen.findByTestId('editor-mode-toggle')
    // switch to JSON
    fireEvent.click(toggle.querySelector('button:last-child')!)
    const textarea = screen.getByRole('textbox', { name: '' })
    fireEvent.change(textarea, { target: { value: 'not valid json' } })
    // try switching back to Visual
    fireEvent.click(toggle.querySelector('button:first-child')!)
    // should still be in JSON mode and show error
    expect(screen.getByRole('textbox', { name: '' })).toBeInTheDocument()
    expect(
      screen.getByText(/fix the json errors before switching to visual mode/i),
    ).toBeInTheDocument()
  })
})
