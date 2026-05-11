/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useBatteries, useDeleteBattery } from '@/hooks/useBatteries'
import { Button } from '@/components/ui/Button'
import { CopyButton } from '@/components/ui/CopyButton'

export const Route = createFileRoute('/batteries/')({
  component: BatteriesPage,
})

function BatteriesPage() {
  const { data: batteries, isLoading } = useBatteries()
  const deleteBattery = useDeleteBattery()
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  function handleDelete(id: string) {
    deleteBattery.mutate(id, {
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
        <h1 className="text-2xl font-semibold">Battery Instances</h1>
        <Button asChild>
          <Link to="/batteries/new">+ Deploy Battery</Link>
        </Button>
      </div>

      {!batteries || batteries.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-[var(--color-muted-foreground)]">
          <p className="mb-4">No batteries deployed yet.</p>
          <Button asChild variant="outline">
            <Link to="/batteries/new">Deploy one</Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-muted)] text-left text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Battery Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {batteries.map((b) => (
                <tr key={b.id} className="bg-[var(--color-card)] hover:bg-[var(--color-muted)]">
                  <td className="px-4 py-3 font-medium">{b.name || '—'}</td>
                  <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                    {b.batteryTypeName}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        b.isComplete
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {b.isComplete ? 'Complete' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                    {new Date(b.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link to="/batteries/$id" params={{ id: b.id }}>
                          View
                        </Link>
                      </Button>
                      <CopyButton
                        id={b.shareToken}
                        label="Copy Link"
                        shareUrl={`${window.location.origin}/take-battery/${b.shareToken}`}
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setPendingDelete(b.id)}
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
            <h2 className="mb-2 text-lg font-semibold">Delete Battery?</h2>
            <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPendingDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={deleteBattery.isPending}
                onClick={() => handleDelete(pendingDelete)}
              >
                {deleteBattery.isPending ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
