/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useBatteries, useDeleteBattery } from '@/hooks/useBatteries'
import { useBatteryTypes } from '@/hooks/useBatteryTypes'
import { Button } from '@/components/ui/Button'
import { CopyButton } from '@/components/ui/CopyButton'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/batteries/')({
  component: BatteriesPage,
})

function BatteriesPage() {
  const { data: batteries, isLoading } = useBatteries()
  const { data: batteryTypes } = useBatteryTypes()
  const deleteBattery = useDeleteBattery()
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  const filtered = selectedTypeId
    ? (batteries ?? []).filter((b) => b.batteryTypeId === selectedTypeId)
    : (batteries ?? [])

  function handleDelete(id: string) {
    deleteBattery.mutate(id, {
      onSuccess: () => setPendingDelete(null),
    })
  }

  return (
    <div className="flex gap-6">
      <aside className="w-52 shrink-0">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
          Battery Types
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
          {batteryTypes?.map((type) => {
            const count = (batteries ?? []).filter((b) => b.batteryTypeId === type.id).length
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

      <div className="min-w-0 flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">
            {selectedTypeId
              ? (batteryTypes?.find((t) => t.id === selectedTypeId)?.title ?? 'Batteries')
              : 'Batteries'}
          </h1>
          <Button asChild>
            <Link to="/batteries/new">+ New Battery</Link>
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
                  {!selectedTypeId && <th className="px-4 py-3">Type</th>}
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((b) => (
                  <tr key={b.id} className="bg-[var(--color-card)] hover:bg-[var(--color-muted)]">
                    {!selectedTypeId && (
                      <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                        {b.batteryTypeName}
                      </td>
                    )}
                    <td className="px-4 py-3 font-medium">{b.name || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                          b.isComplete
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800',
                        )}
                      >
                        {b.isComplete ? 'Complete' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <CopyButton
                          id={b.id}
                          label="Copy Link"
                          shareUrl={window.location.origin + '/take-battery/' + b.shareToken}
                        />
                        <Button asChild size="sm" variant="outline">
                          <Link to="/batteries/$id" params={{ id: b.id }}>View</Link>
                        </Button>
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
      </div>

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-lg bg-[var(--color-card)] p-6 shadow-xl">
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
