import { render, screen, fireEvent } from '@testing-library/react'
import { vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router'
import { routeTree } from '../routeTree.gen'
import type { QuestionnaireType } from '@/types'

vi.mock('@/components/survey/SurveyRenderer', () => ({
  SurveyRenderer: ({ surveyJson, theme }: { surveyJson: object; theme?: string }) => (
    <div data-testid="survey-renderer" data-theme={theme}>
      {JSON.stringify(surveyJson)}
    </div>
  ),
  SURVEY_THEMES: { Default: {}, Flat: {}, Plain: {}, Sharp: {}, Borderless: {}, Solid: {} },
  DEFAULT_THEME_KEY: 'Default',
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
    const textarea = (await screen.findByTestId('json-textarea')) as HTMLTextAreaElement
    expect(textarea.value).toContain('"pages"')
  })

  it('disables Save when JSON is invalid', async () => {
    renderAt('/questionnaire-types/q1/json')
    const toggle = await screen.findByTestId('editor-mode-toggle')
    fireEvent.click(toggle.querySelector('button:last-child')!)
    const textarea = screen.getByTestId('json-textarea') as HTMLTextAreaElement
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
    const textarea = screen.getByTestId('json-textarea') as HTMLTextAreaElement
    const newJson = JSON.stringify({ pages: [{ name: 'p1' }] }, null, 2)
    fireEvent.change(textarea, { target: { value: newJson } })
    const preview = screen.getByTestId('survey-renderer')
    expect(preview.textContent).toContain('p1')
  })

  it('retains the last valid preview when invalid JSON is typed (JSON mode)', async () => {
    renderAt('/questionnaire-types/q1/json')
    const toggle = await screen.findByTestId('editor-mode-toggle')
    fireEvent.click(toggle.querySelector('button:last-child')!)
    const textarea = screen.getByTestId('json-textarea') as HTMLTextAreaElement
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
    expect(screen.queryByTestId('json-textarea')).not.toBeInTheDocument()
  })

  it('switching to JSON mode shows the textarea', async () => {
    renderAt('/questionnaire-types/q1/json')
    const toggle = await screen.findByTestId('editor-mode-toggle')
    fireEvent.click(toggle.querySelector('button:last-child')!)
    expect(screen.getByTestId('json-textarea')).toBeInTheDocument()
  })

  it('switching back to Visual mode hides the textarea', async () => {
    renderAt('/questionnaire-types/q1/json')
    const toggle = await screen.findByTestId('editor-mode-toggle')
    // go to JSON
    fireEvent.click(toggle.querySelector('button:last-child')!)
    expect(screen.getByTestId('json-textarea')).toBeInTheDocument()
    // back to Visual
    fireEvent.click(toggle.querySelector('button:first-child')!)
    expect(screen.queryByTestId('json-textarea')).not.toBeInTheDocument()
  })

  it('switching to Visual mode with invalid JSON does not show an error and succeeds', async () => {
    renderAt('/questionnaire-types/q1/json')
    const toggle = await screen.findByTestId('editor-mode-toggle')
    // switch to JSON
    fireEvent.click(toggle.querySelector('button:last-child')!)
    const textarea = screen.getByTestId('json-textarea')
    fireEvent.change(textarea, { target: { value: 'not valid json' } })
    // switching back to Visual always succeeds — no error, no blocking
    fireEvent.click(toggle.querySelector('button:first-child')!)
    expect(screen.queryByTestId('json-textarea')).not.toBeInTheDocument()
    // the structural outline should be shown
    expect(screen.getByTestId('survey-outline')).toBeInTheDocument()
  })

  it('mode-switch Visual→JSON→Visual does not change the JSON string', async () => {
    const surveyWithExtras: QuestionnaireType = {
      ...testQuestionnaire,
      surveyJson: {
        title: 'Round-trip survey',
        pages: [{ name: 'p1', elements: [{ type: 'text', name: 'q1', title: 'Q1' }] }],
        triggers: [{ type: 'complete' }],
        logo: 'logo.png',
      },
    }
    mockUseQuestionnaire.mockReturnValue({ data: surveyWithExtras, isLoading: false })
    renderAt('/questionnaire-types/q1/json')
    const toggle = await screen.findByTestId('editor-mode-toggle')
    // Switch to JSON — capture text
    fireEvent.click(toggle.querySelector('button:last-child')!)
    const textarea = screen.getByTestId('json-textarea') as HTMLTextAreaElement
    const jsonBefore = textarea.value
    // Switch back to Visual
    fireEvent.click(toggle.querySelector('button:first-child')!)
    // Switch to JSON again
    fireEvent.click(toggle.querySelector('button:last-child')!)
    const textareaAfter = screen.getByTestId('json-textarea') as HTMLTextAreaElement
    expect(textareaAfter.value).toBe(jsonBefore)
  })

  // ---- Theme selector tests ----

  it('renders the preview theme selector', async () => {
    renderAt('/questionnaire-types/q1/json')
    const select = await screen.findByTestId('preview-theme-select')
    expect(select).toBeInTheDocument()
  })

  it('theme selector has expected options', async () => {
    renderAt('/questionnaire-types/q1/json')
    const select = (await screen.findByTestId('preview-theme-select')) as HTMLSelectElement
    const optionValues = Array.from(select.options).map((o) => o.value)
    expect(optionValues).toEqual(
      expect.arrayContaining(['Default', 'Flat', 'Plain', 'Sharp', 'Borderless', 'Solid']),
    )
  })

  it('changing the theme selector updates the theme prop on SurveyRenderer', async () => {
    renderAt('/questionnaire-types/q1/json')
    const select = (await screen.findByTestId('preview-theme-select')) as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'Flat' } })
    const preview = screen.getByTestId('survey-renderer')
    expect(preview.getAttribute('data-theme')).toBe('Flat')
  })

  // ---- Visual editor (Phase 2) ----

  it('renders survey-outline in visual mode', async () => {
    renderAt('/questionnaire-types/q1/json')
    const outline = await screen.findByTestId('survey-outline')
    expect(outline).toBeInTheDocument()
  })

  it('renders survey settings section in visual mode', async () => {
    renderAt('/questionnaire-types/q1/json')
    const settings = await screen.findByTestId('survey-settings')
    expect(settings).toBeInTheDocument()
  })

  it('editing survey title in visual mode updates the JSON text', async () => {
    const surveyWithTitle: QuestionnaireType = {
      ...testQuestionnaire,
      surveyJson: {
        title: 'Old title',
        pages: [{ name: 'p1', elements: [] }],
        description: 'Keep me',
      },
    }
    mockUseQuestionnaire.mockReturnValue({ data: surveyWithTitle, isLoading: false })
    renderAt('/questionnaire-types/q1/json')

    const titleInput = await screen.findByTestId('survey-title-input')
    fireEvent.change(titleInput, { target: { value: 'New title' } })

    // Switch to JSON to verify
    const toggle = screen.getByTestId('editor-mode-toggle')
    fireEvent.click(toggle.querySelector('button:last-child')!)
    const textarea = screen.getByTestId('json-textarea') as HTMLTextAreaElement
    const parsed = JSON.parse(textarea.value)
    expect(parsed.title).toBe('New title')
    // Sibling keys must be unaffected
    expect(parsed.description).toBe('Keep me')
    expect(parsed.pages).toBeDefined()
  })

  it('editing element title in visual mode does not change other element properties', async () => {
    const surveyWithElement: QuestionnaireType = {
      ...testQuestionnaire,
      surveyJson: {
        title: 'Survey',
        pages: [
          {
            name: 'p1',
            elements: [
              { type: 'text', name: 'q1', title: 'Old', isRequired: true, description: 'Hint' },
            ],
          },
        ],
      },
    }
    mockUseQuestionnaire.mockReturnValue({ data: surveyWithElement, isLoading: false })
    renderAt('/questionnaire-types/q1/json')

    // Expand element 0
    const expandBtn = await screen.findByTestId('element-expand-btn-0')
    fireEvent.click(expandBtn)

    // Edit title
    const titleInput = screen.getByTestId('element-title-input-0')
    fireEvent.change(titleInput, { target: { value: 'New question title' } })

    // Switch to JSON
    const toggle = screen.getByTestId('editor-mode-toggle')
    fireEvent.click(toggle.querySelector('button:last-child')!)
    const textarea = screen.getByTestId('json-textarea') as HTMLTextAreaElement
    const parsed = JSON.parse(textarea.value)
    const el = parsed.pages[0].elements[0]
    expect(el.title).toBe('New question title')
    // Unchanged fields must be preserved
    expect(el.isRequired).toBe(true)
    expect(el.description).toBe('Hint')
    expect(el.name).toBe('q1')
    expect(el.type).toBe('text')
  })

  it('toggling required checkbox in visual mode updates isRequired in JSON', async () => {
    const surveyWithElement: QuestionnaireType = {
      ...testQuestionnaire,
      surveyJson: {
        pages: [
          {
            name: 'p1',
            elements: [{ type: 'text', name: 'q1', title: 'Q1' }],
          },
        ],
      },
    }
    mockUseQuestionnaire.mockReturnValue({ data: surveyWithElement, isLoading: false })
    renderAt('/questionnaire-types/q1/json')

    const expandBtn = await screen.findByTestId('element-expand-btn-0')
    fireEvent.click(expandBtn)

    const checkbox = screen.getByTestId('element-required-checkbox-0') as HTMLInputElement
    expect(checkbox.checked).toBe(false)
    fireEvent.click(checkbox)

    // Switch to JSON
    const toggle = screen.getByTestId('editor-mode-toggle')
    fireEvent.click(toggle.querySelector('button:last-child')!)
    const textarea = screen.getByTestId('json-textarea') as HTMLTextAreaElement
    const parsed = JSON.parse(textarea.value)
    expect(parsed.pages[0].elements[0].isRequired).toBe(true)
  })

  it('editing choices in visual mode updates choices array in JSON', async () => {
    const surveyWithRadio: QuestionnaireType = {
      ...testQuestionnaire,
      surveyJson: {
        pages: [
          {
            name: 'p1',
            elements: [{ type: 'radiogroup', name: 'q1', title: 'Pick one', choices: ['A', 'B'] }],
          },
        ],
      },
    }
    mockUseQuestionnaire.mockReturnValue({ data: surveyWithRadio, isLoading: false })
    renderAt('/questionnaire-types/q1/json')

    const expandBtn = await screen.findByTestId('element-expand-btn-0')
    fireEvent.click(expandBtn)

    const choicesTextarea = screen.getByTestId('choices-textarea') as HTMLTextAreaElement
    fireEvent.change(choicesTextarea, { target: { value: 'X\nY\nZ' } })

    // Switch to JSON
    const toggle = screen.getByTestId('editor-mode-toggle')
    fireEvent.click(toggle.querySelector('button:last-child')!)
    const textarea = screen.getByTestId('json-textarea') as HTMLTextAreaElement
    const parsed = JSON.parse(textarea.value)
    expect(parsed.pages[0].elements[0].choices).toEqual(['X', 'Y', 'Z'])
    // Other element properties must be unchanged
    expect(parsed.pages[0].elements[0].title).toBe('Pick one')
  })

  it('add question button appends a new element to the page', async () => {
    const surveyWithPage: QuestionnaireType = {
      ...testQuestionnaire,
      surveyJson: { pages: [{ name: 'p1', elements: [] }] },
    }
    mockUseQuestionnaire.mockReturnValue({ data: surveyWithPage, isLoading: false })
    renderAt('/questionnaire-types/q1/json')

    const addBtn = await screen.findByTestId('add-question-btn-0')
    fireEvent.click(addBtn)

    // Switch to JSON to verify
    const toggle = screen.getByTestId('editor-mode-toggle')
    fireEvent.click(toggle.querySelector('button:last-child')!)
    const textarea = screen.getByTestId('json-textarea') as HTMLTextAreaElement
    const parsed = JSON.parse(textarea.value)
    expect(parsed.pages[0].elements.length).toBe(1)
  })

  it('delete question button removes the element from the page', async () => {
    const surveyWithElement: QuestionnaireType = {
      ...testQuestionnaire,
      surveyJson: {
        pages: [
          {
            name: 'p1',
            elements: [{ type: 'text', name: 'q1', title: 'To delete' }],
          },
        ],
      },
    }
    mockUseQuestionnaire.mockReturnValue({ data: surveyWithElement, isLoading: false })
    renderAt('/questionnaire-types/q1/json')

    const deleteBtn = await screen.findByRole('button', { name: 'Delete question' })
    fireEvent.click(deleteBtn)

    // Switch to JSON
    const toggle = screen.getByTestId('editor-mode-toggle')
    fireEvent.click(toggle.querySelector('button:last-child')!)
    const textarea = screen.getByTestId('json-textarea') as HTMLTextAreaElement
    const parsed = JSON.parse(textarea.value)
    expect(parsed.pages[0].elements.length).toBe(0)
  })

  it('complex element types show read-only badge instead of edit controls', async () => {
    const surveyWithMatrix: QuestionnaireType = {
      ...testQuestionnaire,
      surveyJson: {
        pages: [
          {
            name: 'p1',
            elements: [{ type: 'matrix', name: 'q1', title: 'Matrix' }],
          },
        ],
      },
    }
    mockUseQuestionnaire.mockReturnValue({ data: surveyWithMatrix, isLoading: false })
    renderAt('/questionnaire-types/q1/json')

    const expandBtn = await screen.findByTestId('element-expand-btn-0')
    fireEvent.click(expandBtn)

    expect(screen.getByTestId('complex-type-badge-0')).toBeInTheDocument()
    expect(screen.queryByTestId('element-title-input-0')).not.toBeInTheDocument()
  })

  it('unknown element properties are shown in Other properties section', async () => {
    const surveyWithUnknown: QuestionnaireType = {
      ...testQuestionnaire,
      surveyJson: {
        pages: [
          {
            name: 'p1',
            elements: [
              {
                type: 'text',
                name: 'q1',
                title: 'Q1',
                defaultValueExpression: 'today()',
                validators: [{ type: 'email' }],
              },
            ],
          },
        ],
      },
    }
    mockUseQuestionnaire.mockReturnValue({ data: surveyWithUnknown, isLoading: false })
    renderAt('/questionnaire-types/q1/json')

    const expandBtn = await screen.findByTestId('element-expand-btn-0')
    fireEvent.click(expandBtn)

    const otherSection = screen.getByTestId('other-properties')
    expect(otherSection).toBeInTheDocument()
  })

  it('add page button appends a new page to a paged survey', async () => {
    const surveyPaged: QuestionnaireType = {
      ...testQuestionnaire,
      surveyJson: {
        pages: [{ name: 'p1', elements: [] }],
      },
    }
    mockUseQuestionnaire.mockReturnValue({ data: surveyPaged, isLoading: false })
    renderAt('/questionnaire-types/q1/json')

    const addPageBtn = await screen.findByTestId('add-page-btn')
    fireEvent.click(addPageBtn)

    const toggle = screen.getByTestId('editor-mode-toggle')
    fireEvent.click(toggle.querySelector('button:last-child')!)
    const textarea = screen.getByTestId('json-textarea') as HTMLTextAreaElement
    const parsed = JSON.parse(textarea.value)
    expect(parsed.pages.length).toBe(2)
  })

  it('visual edits update the live preview without mode switching', async () => {
    const surveyWithTitle: QuestionnaireType = {
      ...testQuestionnaire,
      surveyJson: { title: 'Original', pages: [{ name: 'p1', elements: [] }] },
    }
    mockUseQuestionnaire.mockReturnValue({ data: surveyWithTitle, isLoading: false })
    renderAt('/questionnaire-types/q1/json')

    const titleInput = await screen.findByTestId('survey-title-input')
    fireEvent.change(titleInput, { target: { value: 'Updated live' } })

    // Preview should reflect the updated JSON
    const preview = screen.getByTestId('survey-renderer')
    expect(preview.textContent).toContain('Updated live')
  })
})
