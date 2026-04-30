import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuestionnaire } from '@/hooks/useQuestionnaires'
import SurveyCreatorWidget from '@/components/survey/SurveyCreatorWidget'

export const Route = createFileRoute('/questionnaires/$id/edit')({
  component: EditQuestionnairePage,
})

function EditQuestionnairePage() {
  const { id } = Route.useParams()
  const { data: questionnaire, isLoading, isError } = useQuestionnaire(id)

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        Loading…
      </div>
    )
  }

  if (isError || !questionnaire) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Failed to load questionnaire.</p>
        <Link to="/questionnaires" className="text-sm underline">
          Back to list
        </Link>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center gap-4 border-b px-4 py-2">
        <Link to="/questionnaires" className="text-sm text-gray-500 hover:underline">
          ← Back to list
        </Link>
        <span className="font-medium">{questionnaire.title}</span>
      </div>
      <div className="flex-1 overflow-hidden">
        <SurveyCreatorWidget
          questionnaireId={id}
          initialJson={questionnaire.surveyJson}
        />
      </div>
    </div>
  )
}
