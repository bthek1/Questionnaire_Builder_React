import { createFileRoute } from '@tanstack/react-router'
import { QuestionnaireForm } from '@/components/questionnaire/QuestionnaireForm'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">Questionnaire Builder</h1>
      <QuestionnaireForm />
    </main>
  )
}
