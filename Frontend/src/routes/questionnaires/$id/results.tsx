import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/questionnaires/$id/results')({
  component: ResultsPage,
})

function ResultsPage() {
  const { id } = Route.useParams()
  return (
    <div>
      <h1 className="text-2xl font-semibold">Results</h1>
      <p className="mt-2 text-gray-500">Analytics coming soon (Plan 05). ID: {id}</p>
    </div>
  )
}
