/* eslint-disable react-refresh/only-export-components */
import { useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuestionnaire } from '@/hooks/useQuestionnaires'
import { Button } from '@/components/ui/Button'
import { evaluateMetrics, metricsFromStored, type MetricResult } from '@/lib/metrics'

export const Route = createFileRoute('/questionnaires/$id/results')({
  component: ResultsPage,
})

function ResultsPage() {
  const { id } = Route.useParams()
  const { data: instance, isLoading, isError } = useQuestionnaire(id)

  const metrics = useMemo((): MetricResult[] => {
    // Prefer the snapshot taken at submit time; fall back to the live type definition
    const surveyJson = instance?.surveyJsonSnapshot ?? instance?.questionnaireType?.surveyJson
    if (!surveyJson || !instance?.answers) return []

    const storedMetrics = instance.metrics
    // If stored metrics are non-empty, use them directly (no Model instantiation)
    if (storedMetrics && Object.keys(storedMetrics).length > 0) {
      return metricsFromStored(surveyJson, storedMetrics)
    }
    // Fallback: re-evaluate via Model (pre-PLAN-15 records or un-submitted instances)
    return evaluateMetrics(surveyJson, instance.answers as Record<string, unknown>)
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
              <p className="mb-1 text-sm text-[var(--color-muted-foreground)]">{m.label}</p>
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


