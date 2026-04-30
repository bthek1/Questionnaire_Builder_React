import { useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Model } from 'survey-core'
import { useQuestionnaire } from '@/hooks/useQuestionnaires'
import { useResponses } from '@/hooks/useResponses'
import { Button } from '@/components/ui/Button'
import type { QuestionnaireResponse } from '@/types'

export const Route = createFileRoute('/responses/$id/')({
  component: ResponseDetailPage,
})

// ── Modal shell ────────────────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-12">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  )
}

// ── Metrics viewer ─────────────────────────────────────────────────────────────

function MetricsViewer({ surveyJson, answers }: { surveyJson: object; answers: object }) {
  const metrics = useMemo(() => {
    const m = new Model(surveyJson)
    m.data = answers
    return m.calculatedValues.map((cv) => ({
      name: cv.name,
      value: cv.value,
    }))
  }, [surveyJson, answers])

  if (metrics.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No calculated metrics are defined in this questionnaire's JSON (add{' '}
        <code className="rounded bg-gray-100 px-1">calculatedValues</code> to the survey
        definition).
      </p>
    )
  }

  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
        <tr>
          <th className="px-4 py-2">Metric</th>
          <th className="px-4 py-2">Value</th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {metrics.map((m) => (
          <tr key={m.name} className="bg-white">
            <td className="px-4 py-2 font-medium">{m.name}</td>
            <td className="px-4 py-2 text-gray-700">
              {m.value === null || m.value === undefined ? (
                <span className="text-gray-400">—</span>
              ) : typeof m.value === 'object' ? (
                <code className="text-xs">{JSON.stringify(m.value)}</code>
              ) : (
                String(m.value)
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ── Response row ───────────────────────────────────────────────────────────────

function ResponseRow({
  index,
  response,
  questionnaireId,
  surveyJson,
}: {
  index: number
  response: QuestionnaireResponse
  questionnaireId: string
  surveyJson: object
}) {
  const [modal, setModal] = useState<'metrics' | null>(null)
  const [downloading, setDownloading] = useState(false)

  function handleDownloadPdf() {
    setDownloading(true)
    window.open(`/api/questionnaires/${questionnaireId}/responses/${response.id}/pdf/`)
    setDownloading(false)
  }

  return (
    <>
      <tr className="bg-white hover:bg-gray-50">
        <td className="px-4 py-3 text-gray-500">{index + 1}</td>
        <td className="px-4 py-3 whitespace-nowrap text-gray-500">
          {new Date(response.submittedAt).toLocaleString()}
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-2">
            <Button asChild size="sm" variant="outline">
              <Link
                to="/responses/$id/$responseId"
                params={{ id: questionnaireId, responseId: response.id }}
              >
                Open
              </Link>
            </Button>
            <Button size="sm" variant="outline" onClick={() => setModal('metrics')}>
              View Metrics
            </Button>
            <Button size="sm" variant="outline" onClick={handleDownloadPdf} disabled={downloading}>
              {downloading ? 'Generating…' : 'Download PDF'}
            </Button>
          </div>
        </td>
      </tr>

      {modal === 'metrics' && (
        <Modal title={`Metrics — Response #${index + 1}`} onClose={() => setModal(null)}>
          <MetricsViewer surveyJson={surveyJson} answers={response.answers} />
        </Modal>
      )}
    </>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

function ResponseDetailPage() {
  const { id } = Route.useParams()
  const { data: questionnaire, isLoading: loadingQ } = useQuestionnaire(id)
  const { data: responses, isLoading: loadingR } = useResponses(id)

  if (loadingQ || loadingR) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    )
  }

  const responseList = responses ?? []
  const surveyJson = questionnaire?.surveyJson ?? {}

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild size="sm" variant="outline">
          <Link to="/responses">← Back</Link>
        </Button>
        <h1 className="text-2xl font-semibold">{questionnaire?.title ?? 'Responses'}</h1>
        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          {responseList.length} {responseList.length === 1 ? 'response' : 'responses'}
        </span>
      </div>

      {responseList.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-gray-500">
          <p>No responses yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {responseList.map((r, i) => (
                <ResponseRow
                  key={r.id}
                  index={i}
                  response={r}
                  questionnaireId={id}
                  surveyJson={surveyJson}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
