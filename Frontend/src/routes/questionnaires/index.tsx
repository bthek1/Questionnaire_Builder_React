import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuestionnaires, useDeleteQuestionnaire } from '@/hooks/useQuestionnaires'
import { Button } from '@/components/ui/Button'
import { CopyButton } from '@/components/ui/CopyButton'

export const Route = createFileRoute('/questionnaires/')({
  component: QuestionnairesPage,
})

function QuestionnairesPage() {
  const { data: questionnaires, isLoading } = useQuestionnaires()
  const deleteQuestionnaire = useDeleteQuestionnaire()
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  function handleDelete(id: string) {
    deleteQuestionnaire.mutate(id, {
      onSuccess: () => setPendingDelete(null),
    })
  }

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
        <h1 className="text-2xl font-semibold">Questionnaire Types</h1>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link to="/questionnaires/share">Share Links</Link>
          </Button>
          <Button asChild>
            <Link to="/questionnaires/new">+ New Questionnaire</Link>
          </Button>
        </div>
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
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {questionnaires.map((q) => (
                <tr key={q.id} className="bg-[var(--color-card)] hover:bg-[var(--color-muted)]">
                  <td className="px-4 py-3 font-medium">{q.title}</td>
                  <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                    {new Date(q.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link to="/questionnaires/$id/json" params={{ id: q.id }}>
                          Edit
                        </Link>
                      </Button>
                      <CopyButton id={q.id} label="Share" />
                      <Button asChild size="sm" variant="outline">
                        <Link to="/questionnaires/$id/results" params={{ id: q.id }}>
                          Results
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setPendingDelete(q.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation dialog */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-lg bg-[var(--color-card)] p-6 shadow-lg">
            <h2 className="mb-2 text-lg font-semibold">Delete questionnaire?</h2>
            <p className="mb-6 text-sm text-[var(--color-muted-foreground)]">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setPendingDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(pendingDelete)}
                disabled={deleteQuestionnaire.isPending}
              >
                {deleteQuestionnaire.isPending ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
