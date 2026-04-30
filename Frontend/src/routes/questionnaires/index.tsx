/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuestionnaires, useDeleteQuestionnaire } from '@/hooks/useQuestionnaires'
import { useQuestionnaireTypes } from '@/hooks/useQuestionnaireTypes'
import { Button } from '@/components/ui/Button'
import { CopyButton } from '@/components/ui/CopyButton'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/questionnaires/')({
  component: QuestionnairesInstancePage,
})

function QuestionnairesInstancePage() {
  const { data: instances, isLoading } = useQuestionnaires()
  const { data: types } = useQuestionnaireTypes()
  const deleteInstance = useDeleteQuestionnaire()
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  const filtered = selectedTypeId
    ? (instances ?? []).filter((i) => i.questionnaireTypeId === selectedTypeId)
    : (instances ?? [])

  function handleDelete(id: string) {
    deleteInstance.mutate(id, {
      onSuccess: () => setPendingDelete(null),
    })
  }

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <aside className="w-52 shrink-0">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
          Questionnaire Types
        </h2>
        <nav className="space-y-1">
          <button
            onClick={() => setSelectedTypeId(null)}
            className={cn(
              'w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
              selectedTypeId === null
                ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                : 'text-[var(--color-foreground)] hover:bg-[var(--color-muted)]',
            )}
          >
            All types
          </button>
          {types?.map((type) => {
            const count = (instances ?? []).filter((i) => i.questionnaireTypeId === type.id).length
            return (
              <button
                key={type.id}
                onClick={() => setSelectedTypeId(type.id)}
                className={cn(
                  'w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
                  selectedTypeId === type.id
                    ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                    : 'text-[var(--color-foreground)] hover:bg-[var(--color-muted)]',
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate">{type.title}</span>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-1.5 py-0.5 text-xs',
                      selectedTypeId === type.id
                        ? 'bg-white/20 text-white'
                        : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]',
                    )}
                  >
                    {count}
                  </span>
                </span>
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="min-w-0 flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">
            {selectedTypeId
              ? (types?.find((t) => t.id === selectedTypeId)?.title ?? 'Questionnaires')
              : 'Questionnaires'}
          </h1>
          <Button asChild>
            <Link to="/questionnaires/new">+ New Deployment</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-[var(--color-muted)]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center text-[var(--color-muted-foreground)]">
            <p className="mb-4">No questionnaires deployed yet.</p>
            <Button asChild variant="outline">
              <Link to="/questionnaires/new">Deploy one</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-muted)] text-left text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
                <tr>
                  {!selectedTypeId && <th className="px-4 py-3">Type</th>}
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((inst) => {
                  const surveyJson = inst.questionnaireType?.surveyJson as Record<string, unknown> | undefined
                  const hasMetrics =
                    inst.submittedAt &&
                    Object.keys(inst.answers).length > 0 &&
                    Array.isArray(surveyJson?.calculatedValues) &&
                    (surveyJson!.calculatedValues as unknown[]).length > 0

                  return (
                  <tr key={inst.id} className="bg-[var(--color-card)] hover:bg-[var(--color-muted)]">
                    {!selectedTypeId && (
                      <td className="px-4 py-3 font-medium">
                        {inst.questionnaireType?.title ?? inst.questionnaireTypeId}
                      </td>
                    )}
                    <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                      {inst.name || <span className="italic opacity-50">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {inst.submittedAt ? (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                          Submitted
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link to="/questionnaires/$id/view" params={{ id: inst.id }}>
                            View
                          </Link>
                        </Button>
                        <CopyButton
                          id={inst.shareToken}
                          label="Copy Link"
                          shareUrl={`${window.location.origin}/take/${inst.shareToken}`}
                        />
                        {hasMetrics && (
                          <Button asChild size="sm" variant="outline">
                            <Link to="/questionnaires/$id/results" params={{ id: inst.id }}>
                              Results
                            </Link>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setPendingDelete(inst.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {pendingDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-sm rounded-lg bg-[var(--color-card)] p-6 shadow-lg">
              <h2 className="mb-2 text-lg font-semibold">Delete deployment?</h2>
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
                  disabled={deleteInstance.isPending}
                >
                  {deleteInstance.isPending ? 'Deleting…' : 'Delete'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
