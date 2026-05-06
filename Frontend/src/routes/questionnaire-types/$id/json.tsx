/* eslint-disable react-refresh/only-export-components */
import { useState, useCallback, useEffect, useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuestionnaireType, useUpdateQuestionnaireType } from '@/hooks/useQuestionnaireTypes'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { SurveyRenderer } from '@/components/survey/SurveyRenderer'
import {
  QuestionList,
  QuestionEditor,
  SurveyTitleEditor,
  AdvancedQuestionPlaceholder,
} from '@/components/formBuilder'
import { parseSurveyJson, buildSurveyJson, generateUniqueName } from '@/lib/formBuilder'
import type {
  BuilderSurvey,
  BuilderPage,
  BuilderSurveySettings,
  AnyQuestion,
  BuilderQuestion,
  AdvancedQuestion,
} from '@/lib/formBuilder'
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

function isAdvanced(q: AnyQuestion): q is AdvancedQuestion {
  return '_advanced' in q && (q as AdvancedQuestion)._advanced === true
}

function JsonEditor({ questionnaire, id }: JsonEditorProps) {
  const updateQuestionnaire = useUpdateQuestionnaireType(id)
  const initialJson = questionnaire?.surveyJson ?? {}
  const [text, setText] = useState(() => JSON.stringify(initialJson, null, 2))
  const [parseError, setParseError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  // JSON mode preview: updated as user types
  const [jsonPreviewJson, setJsonPreviewJson] = useState<object>(initialJson)

  // Editor mode
  const [mode, setMode] = useState<'visual' | 'json'>('visual')
  const [modeSwitchError, setModeSwitchError] = useState<string | null>(null)

  // Visual builder state
  const [builderSurvey, setBuilderSurvey] = useState<BuilderSurvey>(() =>
    parseSurveyJson(initialJson as Record<string, unknown>),
  )
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null)
  const [selectedPageIndex, setSelectedPageIndex] = useState(0)

  // Helpers: current page questions + updater
  const safePageIndex = Math.min(selectedPageIndex, builderSurvey.pages.length - 1)
  const currentPage: BuilderPage = builderSurvey.pages[safePageIndex] ?? {
    name: 'page1',
    questions: [],
  }
  const currentQuestions = currentPage.questions

  function updateQuestions(questions: AnyQuestion[]) {
    const newPages = builderSurvey.pages.map((p, i) =>
      i === safePageIndex ? { ...p, questions } : p,
    )
    setBuilderSurvey({ ...builderSurvey, pages: newPages })
  }

  function handleAddPage() {
    const newPage: BuilderPage = { name: `page${builderSurvey.pages.length + 1}`, questions: [] }
    const newPages = [...builderSurvey.pages, newPage]
    setBuilderSurvey({ ...builderSurvey, pages: newPages })
    setSelectedPageIndex(newPages.length - 1)
    setSelectedQuestionIndex(null)
  }

  function handleDeletePage(pageIndex: number) {
    if (builderSurvey.pages.length <= 1) return
    const newPages = builderSurvey.pages.filter((_, i) => i !== pageIndex)
    setBuilderSurvey({ ...builderSurvey, pages: newPages })
    setSelectedPageIndex((prev) =>
      Math.max(0, prev >= newPages.length ? newPages.length - 1 : prev),
    )
    setSelectedQuestionIndex(null)
  }

  function handleSettingsChange(patch: Partial<BuilderSurveySettings>) {
    const newSettings = { ...(builderSurvey.settings ?? {}), ...patch }
    // Remove empty/undefined values
    Object.keys(newSettings).forEach((k) => {
      if (!newSettings[k as keyof BuilderSurveySettings])
        delete newSettings[k as keyof BuilderSurveySettings]
    })
    setBuilderSurvey({
      ...builderSurvey,
      settings: Object.keys(newSettings).length ? newSettings : undefined,
    })
  }

  // Derived preview JSON — no useEffect needed, just memoized derivation
  const visualPreviewJson = useMemo(() => buildSurveyJson(builderSurvey), [builderSurvey])
  const previewJson = mode === 'visual' ? visualPreviewJson : jsonPreviewJson

  // Rename state
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameTitle, setRenameTitle] = useState(questionnaire?.title ?? '')
  const renameError = !renameTitle.trim() ? 'Title is required' : ''

  // no-op: preview is read-only, responses should not be submitted
  const handlePreviewComplete = useCallback(() => {}, [])

  function handleJsonChange(value: string) {
    setText(value)
    setSaved(false)
    try {
      const parsed = JSON.parse(value)
      setParseError(null)
      setJsonPreviewJson(parsed)
    } catch {
      setParseError('Invalid JSON')
    }
  }

  function switchToVisual() {
    try {
      const parsed = JSON.parse(text)
      setParseError(null)
      setBuilderSurvey(parseSurveyJson(parsed as Record<string, unknown>))
      setModeSwitchError(null)
      setSelectedQuestionIndex(null)
      setMode('visual')
    } catch {
      setModeSwitchError('Fix the JSON errors before switching to Visual mode.')
    }
  }

  function switchToJson() {
    const json = buildSurveyJson(builderSurvey)
    const jsonStr = JSON.stringify(json, null, 2)
    setText(jsonStr)
    setJsonPreviewJson(json)
    setParseError(null)
    setModeSwitchError(null)
    setMode('json')
  }

  function handleModeToggle(newMode: 'visual' | 'json') {
    if (newMode === mode) return
    if (newMode === 'visual') switchToVisual()
    else switchToJson()
  }

  function handleSave() {
    if (mode === 'visual') {
      const json = buildSurveyJson(builderSurvey)
      updateQuestionnaire.mutate({ surveyJson: json }, { onSuccess: () => setSaved(true) })
    } else {
      try {
        const parsed = JSON.parse(text)
        updateQuestionnaire.mutate({ surveyJson: parsed }, { onSuccess: () => setSaved(true) })
      } catch {
        setParseError('Invalid JSON')
      }
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

  // ---- Visual builder actions ----

  function handleAddQuestion() {
    const names = currentQuestions.map((q) => q.name)
    const newName = generateUniqueName(names)
    const newQ: BuilderQuestion = {
      name: newName,
      title: '',
      type: 'text',
      required: false,
    }
    const questions = [...currentQuestions, newQ]
    updateQuestions(questions)
    setSelectedQuestionIndex(questions.length - 1)
  }

  function handleAddQuestionAt(index: number) {
    const names = currentQuestions.map((q) => q.name)
    const newName = generateUniqueName(names)
    const newQ: BuilderQuestion = {
      name: newName,
      title: '',
      type: 'text',
      required: false,
    }
    const questions = [...currentQuestions]
    questions.splice(index, 0, newQ)
    updateQuestions(questions)
    setSelectedQuestionIndex(index)
  }

  function handleDeleteQuestion(index: number) {
    const questions = currentQuestions.filter((_, i) => i !== index)
    updateQuestions(questions)
    setSelectedQuestionIndex((prev) => {
      if (prev === null) return null
      if (prev === index) return null
      return prev > index ? prev - 1 : prev
    })
  }

  function handleDuplicateQuestion(index: number) {
    const source = currentQuestions[index]
    const names = currentQuestions.map((q) => q.name)
    const newName = generateUniqueName(names)
    const newQ: AnyQuestion =
      '_advanced' in source && source._advanced
        ? { ...source, name: newName }
        : {
            ...(source as BuilderQuestion),
            name: newName,
            title: `${(source as BuilderQuestion).title} (copy)`,
          }
    const questions = [...currentQuestions]
    questions.splice(index + 1, 0, newQ)
    updateQuestions(questions)
    setSelectedQuestionIndex(index + 1)
  }

  function handleMoveUp(index: number) {
    if (index === 0) return
    const questions = [...currentQuestions]
    ;[questions[index - 1], questions[index]] = [questions[index], questions[index - 1]]
    updateQuestions(questions)
    setSelectedQuestionIndex((prev) => (prev === index ? index - 1 : prev))
  }

  function handleMoveDown(index: number) {
    if (index === currentQuestions.length - 1) return
    const questions = [...currentQuestions]
    ;[questions[index], questions[index + 1]] = [questions[index + 1], questions[index]]
    updateQuestions(questions)
    setSelectedQuestionIndex((prev) => (prev === index ? index + 1 : prev))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleAdvancedRawChange(index: number, raw: Record<string, any>) {
    const questions = currentQuestions.map((q, i) =>
      i === index && '_advanced' in q && q._advanced ? { ...q, raw } : q,
    )
    updateQuestions(questions)
  }

  function handleQuestionChange(index: number, updated: BuilderQuestion) {
    const questions = currentQuestions.map((q, i) => (i === index ? updated : q))
    updateQuestions(questions)
  }

  // Duplicate name detection
  const questionNames = currentQuestions.map((q) => q.name)
  const duplicateNames = new Set(
    questionNames.filter((name, i) => questionNames.indexOf(name) !== i),
  )

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

      {modeSwitchError && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          {modeSwitchError}
        </div>
      )}

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
            value={text}
            onChange={(e) => handleJsonChange(e.target.value)}
            rows={40}
            className="rounded-none border-r font-mono text-xs"
            spellCheck={false}
          />
        ) : (
          <div className="space-y-4 overflow-auto rounded-none border-r p-4">
            <SurveyTitleEditor
              value={builderSurvey.title}
              onChange={(t) => setBuilderSurvey({ ...builderSurvey, title: t })}
            />

            {/* Survey settings */}
            <details data-testid="survey-settings-panel">
              <summary className="cursor-pointer text-sm font-medium text-[var(--color-muted-foreground)]">
                Survey settings ▸
              </summary>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="s-description">Description</Label>
                  <Input
                    id="s-description"
                    value={builderSurvey.settings?.description ?? ''}
                    onChange={(e) =>
                      handleSettingsChange({ description: e.target.value || undefined })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="s-locale">Locale</Label>
                  <Input
                    id="s-locale"
                    placeholder="e.g. en, de, fr"
                    value={builderSurvey.settings?.locale ?? ''}
                    onChange={(e) => handleSettingsChange({ locale: e.target.value || undefined })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="s-progress-bar">Progress bar</Label>
                  <select
                    id="s-progress-bar"
                    className="w-full rounded border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1 text-sm"
                    value={builderSurvey.settings?.showProgressBar ?? ''}
                    onChange={(e) =>
                      handleSettingsChange({
                        showProgressBar: (e.target.value ||
                          undefined) as BuilderSurveySettings['showProgressBar'],
                      })
                    }
                  >
                    <option value="">Default (off)</option>
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                    <option value="both">Both</option>
                    <option value="off">Off</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="s-question-numbers">Question numbers</Label>
                  <select
                    id="s-question-numbers"
                    className="w-full rounded border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1 text-sm"
                    value={builderSurvey.settings?.showQuestionNumbers ?? ''}
                    onChange={(e) =>
                      handleSettingsChange({
                        showQuestionNumbers: (e.target.value ||
                          undefined) as BuilderSurveySettings['showQuestionNumbers'],
                      })
                    }
                  >
                    <option value="">Default</option>
                    <option value="on">On</option>
                    <option value="off">Off</option>
                    <option value="onPage">Per page</option>
                  </select>
                </div>
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="s-completed-html">Completed HTML</Label>
                  <Textarea
                    id="s-completed-html"
                    rows={3}
                    value={builderSurvey.settings?.completedHtml ?? ''}
                    onChange={(e) =>
                      handleSettingsChange({ completedHtml: e.target.value || undefined })
                    }
                    placeholder="<p>Thank you for completing the survey!</p>"
                  />
                </div>
              </div>
            </details>

            {/* Page tabs */}
            <div className="flex flex-wrap items-center gap-1">
              {builderSurvey.pages.map((page, pi) => (
                <div key={pi} className="flex items-center gap-0.5">
                  <button
                    type="button"
                    data-testid={`page-tab-${pi}`}
                    onClick={() => {
                      setSelectedPageIndex(pi)
                      setSelectedQuestionIndex(null)
                    }}
                    className={cn(
                      'rounded px-3 py-1 text-sm font-medium transition-colors',
                      pi === safePageIndex
                        ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                        : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)]',
                    )}
                  >
                    {page.title ?? page.name}
                  </button>
                  {builderSurvey.pages.length > 1 && (
                    <button
                      type="button"
                      data-testid={`page-delete-${pi}`}
                      onClick={() => handleDeletePage(pi)}
                      className="rounded px-1 text-xs text-[var(--color-muted-foreground)] hover:text-red-500"
                      title="Delete page"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                data-testid="add-page"
                onClick={handleAddPage}
                className="rounded border border-dashed border-[var(--color-border)] px-3 py-1 text-sm text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                + Page
              </button>
            </div>

            <QuestionList
              questions={currentQuestions}
              selectedIndex={selectedQuestionIndex}
              onSelect={(i) => setSelectedQuestionIndex((prev) => (prev === i ? null : i))}
              onAdd={handleAddQuestion}
              onAddAt={handleAddQuestionAt}
              onDelete={handleDeleteQuestion}
              onDuplicate={handleDuplicateQuestion}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              renderEditor={(i) => {
                const q = currentQuestions[i]
                return isAdvanced(q) ? (
                  <AdvancedQuestionPlaceholder
                    name={q.name}
                    type={q.type}
                    raw={q.raw}
                    onRawChange={(raw) => handleAdvancedRawChange(i, raw)}
                    onDelete={() => handleDeleteQuestion(i)}
                  />
                ) : (
                  <QuestionEditor
                    question={q as BuilderQuestion}
                    onChange={(updated) => handleQuestionChange(i, updated)}
                    duplicateName={duplicateNames.has((q as BuilderQuestion).name)}
                  />
                )
              }}
            />
          </div>
        )}

        <div className="space-y-2 overflow-auto p-4">
          <h2 className="text-sm font-semibold text-gray-600">Preview</h2>
          <div data-testid="survey-preview" className="rounded-lg border bg-white p-4">
            <SurveyRenderer surveyJson={previewJson} onComplete={handlePreviewComplete} />
          </div>
        </div>
      </div>
    </div>
  )
}
