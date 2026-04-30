import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { QuestionnaireForm } from '@/components/questionnaire/QuestionnaireForm'

export const Route = createFileRoute('/questionnaires/new')({
  component: NewQuestionnairePage,
})

function NewQuestionnairePage() {
  const navigate = useNavigate()

  function handleSuccess(id: string) {
    navigate({ to: '/questionnaires/$id/edit', params: { id } })
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">New Questionnaire</h1>
      <QuestionnaireForm onSuccess={handleSuccess} />
    </div>
  )
}
