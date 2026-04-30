import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/questionnaires/$id/edit')({
  component: EditQuestionnairePage,
})

function EditQuestionnairePage() {
  const { id } = Route.useParams()
  return <Navigate to="/questionnaires/$id/json" params={{ id }} replace />
}
