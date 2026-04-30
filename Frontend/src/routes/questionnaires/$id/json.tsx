import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuestionnaire, useUpdateQuestionnaire } from '@/hooks/useQuestionnaires'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import type { Questionnaire } from '@/types'

export const Route = createFileRoute('/questionnaires/$id/json')({
  component: JsonEditorPage,
})

function JsonEditorPage() {
  const { id } = Route.useParams()
  const { data: questionnaire, isLoading } = useQuestionnaire(id)

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
  questionnaire: Questionnaire | undefined
  id: string
}

function JsonEditor({ questionnaire, id }: JsonEditorProps) {
  const updateQuestionnaire = useUpdateQuestionnaire(id)
  const [text, setText] = useState(() =>
    JSON.stringify(questionnaire?.surveyJson ?? {}, null, 2),
  )
  const [parseError, setParseError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function handleChange(value: string) {
    setText(value)
    setSaved(false)
    try {
      JSON.parse(value)
      setParseError(null)
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

      <Textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        rows={30}
        className="font-mono text-xs"
        spellCheck={false}
      />
    </div>
  )
}
