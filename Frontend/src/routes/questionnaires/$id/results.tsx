/* eslint-disable react-refresh/only-export-components */
import { useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Model } from 'survey-core'
import { useQuestionnaire } from '@/hooks/useQuestionnaires'
import { Button } from '@/components/ui/Button'

export const Route = createFileRoute('/questionnaires/$id/results')({
  component: ResultsPage,
})

interface CalcValue {
  name: string
  title?: string
  value: unknown
}

function evaluateMetrics(surveyJson: object, answers: Record<string, unknown>): CalcValue[] {
  const json = surveyJson as Record<string, unknown>
  const calcDefs = Array.isArray(json.calculatedValues)
    ? (json.calculatedValues as Array<{ name: string; title?: string; includeIntoResult?: boolean }>)
    : []

  if (calcDefs.length === 0) return []

  const model = new Model(surveyJson)
  model.data = answers

  return calcDefs.map((def) => ({
    name: def.name,
    title: def.title ?? def.name,
    value: model.getValue(def.name),
  }))
}

function ResultsPage() {
  const { id } = Route.useParams()
  const { data: instance, isLoading, isError } = useQuestionnaire(id)

  const metrics = useMemo(() => {
    if (!instance?.questionnaireType?.surveyJson || !instance.answers) return []
    return evaluateMetrics(
      instance.questionnaireType.surveyJson,
      instance.answers as Record<string, unknown>,
    )
  }, [instance])

  function handleDownloadPdf() {
    window.open(`/api/questionnaires/${id}/pdf/`)
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
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
          {instance.questionnaireType?.title ?? 'Results'}
          {instance.name ? ` — ${instance.name}` : ''}
        </h1>
        {instance.submittedAt ? (
          <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
            Submitted {new Date(instance.submittedAt).toLocaleDateString()}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
            Pending
          </span>
        )}
        {instance.submittedAt && (
          <Button size="sm" variant="outline" onClick={handleDownloadPdf}>
            Download PDF
          </Button>
        )}
      </div>

      {metrics.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-[var(--color-muted-foreground)]">
          <p>No metrics available.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((m) => (
            <div
              key={m.name}
              className="rounded-lg border bg-[var(--color-card)] px-6 py-5 shadow-sm"
            >
              <p className="mb-1 text-sm text-[var(--color-muted-foreground)]">{m.title}</p>
              <p className="text-3xl font-bold text-[var(--color-primary)]">
                {m.value !== null && m.value !== undefined ? String(m.value) : '—'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

