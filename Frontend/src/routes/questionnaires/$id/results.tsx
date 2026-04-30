import { createFileRoute, Link } from '@tanstack/react-router'
import { SurveyPDF } from 'survey-pdf'
import { useQuestionnaire } from '@/hooks/useQuestionnaires'
import { useResponses } from '@/hooks/useResponses'
import { SurveyDashboard } from '@/components/survey/SurveyDashboard'
import { RawResponsesTable } from '@/components/questionnaire/RawResponsesTable'
import { Button } from '@/components/ui/Button'

export const Route = createFileRoute('/questionnaires/$id/results')({
  component: ResultsPage,
})

function ResultsPage() {
  const { id } = Route.useParams()
  const { data: questionnaire, isLoading: loadingQ } = useQuestionnaire(id)
  const { data: responses, isLoading: loadingR } = useResponses(id)

  function handleExportPdf() {
    if (!questionnaire?.surveyJson) return
    try {
      const surveyPdf = new SurveyPDF(questionnaire.surveyJson, {
        fontSize: 14,
        margins: { left: 10, right: 10, top: 10, bot: 10 },
      })
      surveyPdf.save(`${questionnaire.title ?? 'questionnaire-results'}.pdf`)
    } catch (err) {
      console.error('PDF export failed', err)
    }
  }

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
  const lastResponse =
    responseList.length > 0
      ? new Date(
          Math.max(...responseList.map((r) => new Date(r.submittedAt).getTime())),
        ).toLocaleDateString()
      : null

  const shareUrl = `${window.location.origin}/take/${id}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link to="/questionnaires">← Back to list</Link>
            </Button>
          </div>
          <h1 className="text-2xl font-semibold">{questionnaire?.title ?? 'Results'}</h1>
        </div>
        <Button variant="outline" onClick={handleExportPdf} disabled={!questionnaire?.surveyJson}>
          Export PDF
        </Button>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-6 rounded-lg border bg-gray-50 px-6 py-4 text-sm text-gray-600">
        <span>
          <span className="font-semibold text-gray-900">{responseList.length}</span>{' '}
          {responseList.length === 1 ? 'response' : 'responses'}
        </span>
        {lastResponse && (
          <span>
            Last response: <span className="font-semibold text-gray-900">{lastResponse}</span>
          </span>
        )}
      </div>

      {/* Empty state */}
      {responseList.length === 0 && (
        <div className="rounded-lg border border-dashed p-12 text-center text-gray-500">
          <p className="mb-4">No responses yet.</p>
          <p className="text-sm">
            Share this link to collect responses:{' '}
            <a
              href={shareUrl}
              className="font-medium text-blue-600 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {shareUrl}
            </a>
          </p>
        </div>
      )}

      {/* Dashboard */}
      {responseList.length > 0 && questionnaire?.surveyJson && (
        <SurveyDashboard
          surveyJson={questionnaire.surveyJson}
          responses={responseList as object[]}
        />
      )}

      {/* Raw Responses */}
      <RawResponsesTable responses={responseList} />
    </div>
  )
}
