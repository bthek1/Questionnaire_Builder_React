import { useState, useCallback } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuestionnaireType, useUpdateQuestionnaireType } from '@/hooks/useQuestionnaires'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { SurveyRenderer } from '@/components/survey/SurveyRenderer'
import type { QuestionnaireType } from '@/types'

export const Route = createFileRoute('/questionnaires/$id/json')({
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

  const isInvalid = parseError !== null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild size="sm" variant="outline">
            <Link to="/questionnaires">← Back to list</Link>
          </Button>
          <h1 className="text-xl font-semibold">{questionnaire?.title ?? 'JSON Editor'}</h1>
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Textarea
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          rows={30}
          className="font-mono text-xs"
          spellCheck={false}
        />

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-600">Preview</h2>
          <div data-testid="survey-preview" className="rounded-lg border bg-white p-4">
            <SurveyRenderer surveyJson={previewJson} onComplete={handlePreviewComplete} />
          </div>
        </div>
      </div>
    </div>
  )
}
