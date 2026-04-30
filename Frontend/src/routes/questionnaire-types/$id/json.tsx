/* eslint-disable react-refresh/only-export-components */
import { useState, useCallback } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuestionnaireType, useUpdateQuestionnaireType } from '@/hooks/useQuestionnaireTypes'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { SurveyRenderer } from '@/components/survey/SurveyRenderer'
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
  const [text, setText] = useState(() => JSON.stringify(initialJson, null, 2))
  const [parseError, setParseError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [previewJson, setPreviewJson] = useState<object>(initialJson)

  // Rename state
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameTitle, setRenameTitle] = useState(questionnaire?.title ?? '')
  const renameError = !renameTitle.trim() ? 'Title is required' : ''

  // no-op: preview is read-only, responses should not be submitted
  const handlePreviewComplete = useCallback(() => {}, [])

  function handleChange(value: string) {
    setText(value)
    setSaved(false)
    try {
      const parsed = JSON.parse(value)
      setParseError(null)
      setPreviewJson(parsed)
    } catch {
      setParseError('Invalid JSON')
    }
  }

  function handleSave() {
    try {
      const parsed = JSON.parse(text)
      updateQuestionnaire.mutate(
        { surveyJson: parsed },
        {
          onSuccess: () => setSaved(true),
        },
      )
    } catch {
      setParseError('Invalid JSON')
    }
  }

  function handleRenameSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!renameTitle.trim()) return
    updateQuestionnaire.mutate(
      { title: renameTitle.trim() },
      { onSuccess: () => setIsRenaming(false) },
    )
  }

  const isInvalid = parseError !== null

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

      {parseError && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          {parseError}
        </div>
      )}

      {saved && !isInvalid && (
        <div className="rounded-md border border-green-300 bg-green-50 px-4 py-2 text-sm text-green-700">
          Saved successfully.
        </div>
      )}

      {/* Full-viewport-width split view */}
      <div
        className="grid grid-cols-1 gap-0 lg:grid-cols-2"
        style={{ width: '100vw', marginLeft: 'calc(50% - 50vw)' }}
      >
        <Textarea
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          rows={40}
          className="rounded-none border-r font-mono text-xs"
          spellCheck={false}
        />

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
