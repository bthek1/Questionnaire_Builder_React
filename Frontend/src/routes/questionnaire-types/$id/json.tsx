/* eslint-disable react-refresh/only-export-components */
import { useState, useCallback, useEffect } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuestionnaireType, useUpdateQuestionnaireType } from '@/hooks/useQuestionnaireTypes'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import {
  SurveyRenderer,
  SURVEY_THEMES,
  DEFAULT_THEME_KEY,
} from '@/components/survey/SurveyRenderer'
import { cn } from '@/lib/utils'
import type { QuestionnaireType } from '@/types'

export const Route = createFileRoute('/questionnaire-types/$id/json')({
  component: JsonEditorPage,
})

function JsonEditorPage() {
  const { id } = Route.useParams()
  const { data: questionnaire, isLoading } = useQuestionnaireType(id)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    )
  }

  return <JsonEditor questionnaire={questionnaire} id={id} />
}

interface JsonEditorProps {
  questionnaire: QuestionnaireType | undefined
  id: string
}

function JsonEditor({ questionnaire, id }: JsonEditorProps) {
  const updateQuestionnaire = useUpdateQuestionnaireType(id)
  const initialJson = questionnaire?.surveyJson ?? {}

  // Single canonical state — both modes read from this string.
  const [surveyJsonText, setSurveyJsonText] = useState(() => JSON.stringify(initialJson, null, 2))
  const [parseError, setParseError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  // Last successfully parsed JSON — drives the preview and visual outline.
  const [lastValidJson, setLastValidJson] = useState<object>(initialJson)

  // Editor mode — switching never converts or rebuilds the JSON.
  const [mode, setMode] = useState<'visual' | 'json'>('visual')

  // Preview theme selector — persisted across page refreshes
  const [previewTheme, setPreviewTheme] = useState<string>(() => {
    try {
      return localStorage.getItem('surveyPreviewTheme') ?? DEFAULT_THEME_KEY
    } catch {
      return DEFAULT_THEME_KEY
    }
  })

  function handleThemeChange(key: string) {
    setPreviewTheme(key)
    try {
      localStorage.setItem('surveyPreviewTheme', key)
    } catch {
      // localStorage unavailable (e.g. private browsing restrictions)
    }
  }

  // Rename state
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameTitle, setRenameTitle] = useState(questionnaire?.title ?? '')
  const renameError = !renameTitle.trim() ? 'Title is required' : ''

  // no-op: preview is read-only, responses should not be submitted
  const handlePreviewComplete = useCallback(() => {}, [])

  function handleJsonChange(value: string) {
    setSurveyJsonText(value)
    setSaved(false)
    try {
      const parsed = JSON.parse(value)
      setParseError(null)
      setLastValidJson(parsed)
    } catch {
      setParseError('Invalid JSON')
    }
  }

  // Switching modes never touches the JSON — the text is always the canonical source.
  function handleModeToggle(newMode: 'visual' | 'json') {
    if (newMode === mode) return
    setMode(newMode)
  }

  function handleSave() {
    try {
      const parsed = JSON.parse(surveyJsonText)
      updateQuestionnaire.mutate({ surveyJson: parsed }, { onSuccess: () => setSaved(true) })
    } catch {
      setParseError('Invalid JSON')
    }
  }

  // Ctrl+S / Cmd+S save
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  function handleRenameSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!renameTitle.trim()) return
    updateQuestionnaire.mutate(
      { title: renameTitle.trim() },
      { onSuccess: () => setIsRenaming(false) },
    )
  }

  const isInvalid = mode === 'json' && parseError !== null

  return (
    /* Break out of the root layout's max-w-5xl by using negative horizontal margins */
    <div className="-mx-4 space-y-4 px-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild size="sm" variant="outline">
            <Link to="/questionnaire-types">← Back to list</Link>
          </Button>
          {isRenaming ? (
            <form onSubmit={handleRenameSubmit} className="flex items-center gap-2">
              <Input
                value={renameTitle}
                onChange={(e) => setRenameTitle(e.target.value)}
                autoFocus
                className={`text-xl font-semibold${renameError ? ' border-red-400 focus:ring-red-400' : ''}`}
              />
              {updateQuestionnaire.isError && (
                <span className="text-xs text-red-500">Failed to rename.</span>
              )}
              <Button
                type="submit"
                size="sm"
                disabled={updateQuestionnaire.isPending || !!renameError}
              >
                {updateQuestionnaire.isPending ? 'Saving…' : 'Save'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsRenaming(false)
                  setRenameTitle(questionnaire?.title ?? '')
                }}
              >
                Cancel
              </Button>
            </form>
          ) : (
            <>
              <h1 className="text-xl font-semibold">{questionnaire?.title ?? 'JSON Editor'}</h1>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setRenameTitle(questionnaire?.title ?? '')
                  setIsRenaming(true)
                }}
              >
                Rename
              </Button>
            </>
          )}
        </div>
        <Button onClick={handleSave} disabled={isInvalid || updateQuestionnaire.isPending}>
          {updateQuestionnaire.isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>

      {/* Mode toggle */}
      <div
        data-testid="editor-mode-toggle"
        className="inline-flex rounded-full border border-[var(--color-border)] p-0.5"
      >
        <button
          type="button"
          onClick={() => handleModeToggle('visual')}
          className={cn(
            'rounded-full px-4 py-1 text-sm font-medium transition-colors',
            mode === 'visual'
              ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
              : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)]',
          )}
        >
          Visual
        </button>
        <button
          type="button"
          onClick={() => handleModeToggle('json')}
          className={cn(
            'rounded-full px-4 py-1 text-sm font-medium transition-colors',
            mode === 'json'
              ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
              : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)]',
          )}
        >
          JSON
        </button>
      </div>

      {mode === 'json' && parseError && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          {parseError}
        </div>
      )}

      {saved && (
        <div className="rounded-md border border-green-300 bg-green-50 px-4 py-2 text-sm text-green-700">
          Saved successfully.
        </div>
      )}

      {/* Full-viewport-width split view */}
      <div
        className="grid grid-cols-1 gap-0 lg:grid-cols-2"
        style={{ width: '100vw', marginLeft: 'calc(50% - 50vw)' }}
      >
        {/* Left pane */}
        {mode === 'json' ? (
          <Textarea
            value={surveyJsonText}
            onChange={(e) => handleJsonChange(e.target.value)}
            rows={40}
            className="rounded-none border-r font-mono text-xs"
            spellCheck={false}
          />
        ) : (
          <SurveyOutline surveyJson={lastValidJson as Record<string, unknown>} />
        )}

        <div className="space-y-2 overflow-auto p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-gray-600">Preview</h2>
            <div className="flex items-center gap-1.5">
              <label
                htmlFor="preview-theme-select"
                className="text-xs text-[var(--color-muted-foreground)]"
              >
                Theme
              </label>
              <select
                id="preview-theme-select"
                data-testid="preview-theme-select"
                value={previewTheme}
                onChange={(e) => handleThemeChange(e.target.value)}
                className="rounded border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-0.5 text-xs"
              >
                {Object.keys(SURVEY_THEMES).map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div data-testid="survey-preview" className="rounded-lg border bg-white p-4">
            <SurveyRenderer
              surveyJson={lastValidJson}
              onComplete={handlePreviewComplete}
              theme={previewTheme}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Read-only structural outline — Phase 1 visual mode
// ---------------------------------------------------------------------------

interface SurveyOutlineProps {
  surveyJson: Record<string, unknown>
}

function SurveyOutline({ surveyJson }: SurveyOutlineProps) {
  const title = typeof surveyJson.title === 'string' ? surveyJson.title : ''

  // Support both paged format ({ pages: [...] }) and flat format ({ elements: [...] }).
  const pages: Array<Record<string, unknown>> = Array.isArray(surveyJson.pages)
    ? (surveyJson.pages as Array<Record<string, unknown>>)
    : Array.isArray(surveyJson.elements)
      ? [{ name: 'page1', elements: surveyJson.elements }]
      : [{ name: 'page1', elements: [] }]

  return (
    <div data-testid="survey-outline" className="space-y-4 overflow-auto rounded-none border-r p-4">
      {/* Survey title */}
      <div>
        <p className="text-xs text-[var(--color-muted-foreground)]">Survey title</p>
        <p className="text-lg font-semibold">
          {title || <span className="italic text-[var(--color-muted-foreground)]">(untitled)</span>}
        </p>
      </div>

      {/* Pages */}
      {pages.map((page, pi) => {
        const pageName = typeof page.name === 'string' ? page.name : `page${pi + 1}`
        const pageTitle = typeof page.title === 'string' ? page.title : undefined
        const elements: Array<Record<string, unknown>> = Array.isArray(page.elements)
          ? (page.elements as Array<Record<string, unknown>>)
          : []

        return (
          <div key={pi} className="rounded-lg border border-[var(--color-border)] p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
              {pageTitle ?? pageName}
            </p>
            {elements.length === 0 ? (
              <p className="text-sm italic text-[var(--color-muted-foreground)]">
                No elements on this page
              </p>
            ) : (
              <ul className="space-y-1">
                {elements.map((el, ei) => {
                  const elName = typeof el.name === 'string' ? el.name : `element${ei + 1}`
                  const elType = typeof el.type === 'string' ? el.type : 'text'
                  const elTitle = typeof el.title === 'string' ? el.title : ''
                  return (
                    <li key={ei} className="flex items-center gap-2 rounded px-2 py-1 text-sm">
                      <span className="rounded bg-[var(--color-muted)] px-1.5 py-0.5 font-mono text-xs text-[var(--color-muted-foreground)]">
                        {elType}
                      </span>
                      <span className="font-medium">{elTitle || elName}</span>
                      {elTitle && elTitle !== elName && (
                        <span className="text-xs text-[var(--color-muted-foreground)]">
                          ({elName})
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )
      })}

      <p className="text-xs text-[var(--color-muted-foreground)]">
        Switch to JSON mode to edit the survey definition.
      </p>
    </div>
  )
}
