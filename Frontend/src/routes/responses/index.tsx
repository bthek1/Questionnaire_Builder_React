import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuestionnaires } from '@/hooks/useQuestionnaires'
import { useResponses } from '@/hooks/useResponses'
import { Button } from '@/components/ui/Button'

export const Route = createFileRoute('/responses/')({
  component: ResponsesPage,
})

function ResponseRow({
  questionnaireId,
  title,
  createdAt,
}: {
  questionnaireId: string
  title: string
  createdAt: string
}) {
  const { data: responses, isLoading } = useResponses(questionnaireId)

  return (
    <tr className="bg-[var(--color-card)] hover:bg-[var(--color-muted)]">
      <td className="px-4 py-3 font-medium">{title}</td>
      <td className="px-4 py-3 text-[var(--color-muted-foreground)]">{new Date(createdAt).toLocaleDateString()}</td>
      <td className="px-4 py-3 text-[var(--color-foreground)]">
        {isLoading ? (
          <span className="text-[var(--color-muted-foreground)]">…</span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
            {responses?.length ?? 0}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <Button asChild size="sm" variant="outline">
          <Link to="/responses/$id" params={{ id: questionnaireId }}>
            View Responses
          </Link>
        </Button>
      </td>
    </tr>
  )
}

function ResponsesPage() {
  const { data: questionnaires, isLoading } = useQuestionnaires()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-[var(--color-muted)]" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Questionnaires</h1>
      </div>

      {!questionnaires || questionnaires.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-[var(--color-muted-foreground)]">
          <p className="mb-4">No questionnaires yet.</p>
          <Button asChild variant="outline">
            <Link to="/questionnaires/new">Create one</Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-muted)] text-left text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
              <tr>
                <th className="px-4 py-3">Questionnaire</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Responses</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {questionnaires.map((q) => (
                <ResponseRow
                  key={q.id}
                  questionnaireId={q.id}
                  title={q.title}
                  createdAt={q.createdAt}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
