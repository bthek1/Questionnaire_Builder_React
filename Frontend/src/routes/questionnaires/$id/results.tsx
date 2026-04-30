/* eslint-disable react-refresh/only-export-components */
import { useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Model } from 'survey-core'
import { useQuestionnaire } from '@/hooks/useQuestionnaires'
import { Button } from '@/components/ui/Button'

export const Route = createFileRoute('/questionnaires/$id/results')({
  component: ResultsPage,
})

interface MetricResult {
  name: string
  label: string
  value: unknown
}

/** Convert snake_case / camelCase names to "Title Case" for display. */
function formatLabel(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Evaluate all calculatedValues from the surveyJson against the stored answers.
 *
 * How SurveyJS calculatedValues work:
 *  - Each entry in `surveyJson.calculatedValues` has a `name` and an `expression`.
 *  - SurveyJS re-evaluates the expression whenever any referenced question value changes.
 *  - `includeIntoResult: true` causes the result to be merged into `survey.data` on completion
 *    (so it's already stored in `instance.answers`).
 *  - After `model.data = answers`, all expressions are re-evaluated synchronously.
 *  - The results are accessible via `model.calculatedValues` — an array of CalculatedValue
 *    objects, each with `.name` and `.value`.
 */
function evaluateMetrics(surveyJson: object, answers: Record<string, unknown>): MetricResult[] {
  const json = surveyJson as Record<string, unknown>
  const calcDefs = Array.isArray(json.calculatedValues)
    ? (json.calculatedValues as Array<{ name: string; title?: string }>)
    : []
  if (calcDefs.length === 0) return []

  // Build a label map from the JSON defs (title is optional in surveyJson)
  const labelByName = Object.fromEntries(
    calcDefs.map((d) => [d.name, d.title ? String(d.title) : formatLabel(d.name)]),
  )

  // Feed answers into a fresh model — this triggers synchronous re-evaluation of all
  // calculatedValues expressions so model.calculatedValues[i].value is up-to-date.
  const model = new Model(surveyJson)
  model.data = answers

  // model.calculatedValues is CalculatedValue[] with .name and .value
  const cvMap = new Map(
    (model.calculatedValues as Array<{ name: string; value: unknown }>).map((cv) => [
      cv.name,
      cv.value,
    ]),
  )

  return calcDefs
    .filter((def) => def.name in labelByName)
    .map((def) => ({
      name: def.name,
      label: labelByName[def.name],
      // Prefer the freshly evaluated value; fall back to stored answer (includeIntoResult case)
      value: cvMap.has(def.name) ? cvMap.get(def.name) : answers[def.name],
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


