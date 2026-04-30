import { useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Model } from 'survey-core'
import { Survey } from 'survey-react-ui'
import { useQuestionnaire } from '@/hooks/useQuestionnaires'
import { useResponses } from '@/hooks/useResponses'
import { Button } from '@/components/ui/Button'
import 'survey-core/survey-core.css'

export const Route = createFileRoute('/responses/$id/$responseId')({
  component: ResponseViewPage,
})

function ResponseViewPage() {
  const { id, responseId } = Route.useParams()
  const { data: questionnaire, isLoading: loadingQ } = useQuestionnaire(id)
  const { data: responses, isLoading: loadingR } = useResponses(id)
  const [downloading, setDownloading] = useState(false)

  const response = responses?.find((r) => r.id === responseId)
  const index = responses?.findIndex((r) => r.id === responseId) ?? -1

  const survey = useMemo(() => {
    if (!questionnaire?.surveyJson || !response) return null
    const m = new Model(questionnaire.surveyJson)
    m.data = response.answers as Record<string, unknown>
    m.mode = 'display'
    return m
  }, [questionnaire, response])

  if (loadingQ || loadingR) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    )
  }

  if (!response) {
    return (
      <div className="py-24 text-center text-gray-500">
        <p>Response not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/responses/$id" params={{ id }}>← Back</Link>
        </Button>
      </div>
    )
  }

  function handleDownloadPdf() {
    if (!questionnaire?.surveyJson || !response) return
    setDownloading(true)
    window.open(`/api/questionnaires/${id}/responses/${response.id}/pdf/`)
    setDownloading(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild size="sm" variant="outline">
            <Link to="/responses/$id" params={{ id }}>← Back</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">
              {questionnaire?.title ?? 'Response'}
            </h1>
            <p className="text-sm text-gray-500">
              Response #{index + 1} &middot; Submitted {new Date(response.submittedAt).toLocaleString()}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleDownloadPdf}
          disabled={downloading || !questionnaire?.surveyJson}
        >
          {downloading ? 'Generating…' : 'Download PDF'}
        </Button>
      </div>

      {/* Survey in display mode */}
      <div className="rounded-lg border">
        {survey ? (
          <Survey model={survey} />
        ) : (
          <p className="p-8 text-center text-sm text-gray-500">
            No survey definition available.
          </p>
        )}
      </div>
    </div>
  )
}
