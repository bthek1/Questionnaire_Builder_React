/* eslint-disable react-refresh/only-export-components */
import { useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Model } from 'survey-core'
import { Survey } from 'survey-react-ui'
import 'survey-core/survey-core.min.css'
import { useQuestionnaire } from '@/hooks/useQuestionnaires'
import { Button } from '@/components/ui/Button'

export const Route = createFileRoute('/questionnaires/$id/view')({
  component: ViewPage,
})

function ViewPage() {
  const { id } = Route.useParams()
  const { data: instance, isLoading, isError } = useQuestionnaire(id)

  const model = useMemo(() => {
    // Prefer the snapshot taken at submit time so the displayed form matches the
    // answers exactly as they were collected, even if the type definition changes later.
    const surveyJson = instance?.surveyJsonSnapshot ?? instance?.questionnaireType?.surveyJson
    if (!surveyJson) return null
    const m = new Model(surveyJson)
    m.mode = 'display'
    if (instance?.answers && Object.keys(instance.answers).length > 0) {
      m.data = instance.answers
    }
    return m
  }, [instance])

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-[var(--color-muted)]" />
        ))}
      </div>
    )
  }

  if (isError || !instance) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-red-600">Questionnaire not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild size="sm" variant="outline">
          <Link to="/questionnaires">← Back</Link>
        </Button>
        <h1 className="text-2xl font-semibold">
          {instance.questionnaireType?.title ?? 'Questionnaire'}
          {instance.name ? ` — ${instance.name}` : ''}
        </h1>
        {instance.submittedAt ? (
          <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
            Submitted {new Date(instance.submittedAt).toLocaleDateString()}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
            Pending — not yet submitted
          </span>
        )}
      </div>

      {!model ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-[var(--color-muted-foreground)]">
          <p>No survey form defined for this questionnaire type.</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-[var(--color-card)] p-4">
          <Survey model={model} />
        </div>
      )}
    </div>
  )
}
