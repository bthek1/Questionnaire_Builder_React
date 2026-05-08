/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useBatteryTypes, useDeleteBatteryType } from '@/hooks/useBatteryTypes'
import { Button } from '@/components/ui/Button'

export const Route = createFileRoute('/battery-types/')({
  component: BatteryTypesPage,
})

function BatteryTypesPage() {
  const { data: batteryTypes, isLoading } = useBatteryTypes()
  const deleteBatteryType = useDeleteBatteryType()
  const navigate = useNavigate()
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  function handleDelete(id: string) {
    deleteBatteryType.mutate(id, {
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
        <h1 className="text-2xl font-semibold">Battery Types</h1>
        <Button asChild>
          <Link to="/battery-types/new">+ New Battery Type</Link>
        </Button>
      </div>

      {!batteryTypes || batteryTypes.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-[var(--color-muted-foreground)]">
          <p className="mb-4">No battery types yet.</p>
          <Button asChild variant="outline">
            <Link to="/battery-types/new">Create one</Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-muted)] text-left text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Surveys</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {batteryTypes.map((bt) => (
                <tr key={bt.id} className="bg-[var(--color-card)] hover:bg-[var(--color-muted)]">
                  <td className="px-4 py-3 font-medium">{bt.title}</td>
                  <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                    {bt.questionnaireTypeIds.length}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                    {new Date(bt.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link to="/battery-types/$id" params={{ id: bt.id }}>
                          Edit
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          navigate({ to: '/batteries/new', search: { batteryTypeId: bt.id } })
                        }
                      >
                        Deploy
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setPendingDelete(bt.id)}
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

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-lg bg-[var(--color-card)] p-6 shadow-lg">
            <h2 className="mb-2 text-lg font-semibold">Delete Battery Type?</h2>
            <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPendingDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={deleteBatteryType.isPending}
                onClick={() => handleDelete(pendingDelete)}
              >
                {deleteBatteryType.isPending ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
