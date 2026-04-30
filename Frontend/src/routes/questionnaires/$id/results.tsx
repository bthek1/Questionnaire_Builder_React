import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuestionnaire } from '@/hooks/useQuestionnaires'
import { useResponses } from '@/hooks/useResponses'
import { Button } from '@/components/ui/Button'

export const Route = createFileRoute('/questionnaires/$id/results')({
  component: ResultsPage,
})

function ResultsPage() {
  const { id } = Route.useParams()
  const { data: questionnaire, isLoading: loadingQ } = useQuestionnaire(id)
  const { data: responses, isLoading: loadingR } = useResponses(id)

  if (loadingQ || loadingR) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-[var(--color-muted)]" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <p className="text-[var(--color-muted-foreground)] text-sm">This page has moved.</p>
      <Button asChild>
        <Link to="/responses/$id" params={{ id }}>
          View responses for "{questionnaire?.title ?? id}" ({responses?.length ?? 0})
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link to="/responses">All questionnaires</Link>
      </Button>
    </div>
  )
}
