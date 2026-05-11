/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react'
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { z } from 'zod'
import { useBatteryTypes } from '@/hooks/useBatteryTypes'
import { useCreateBattery } from '@/hooks/useBatteries'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'

const searchSchema = z.object({
  batteryTypeId: z.string().optional(),
})

export const Route = createFileRoute('/batteries/new')({
  validateSearch: searchSchema,
  component: NewBatteryPage,
})

function NewBatteryPage() {
  const navigate = useNavigate()
  const { batteryTypeId: preselectedId } = useSearch({ from: '/batteries/new' })
  const { data: batteryTypes, isLoading } = useBatteryTypes()
  const createBattery = useCreateBattery()

  const [batteryTypeId, setBatteryTypeId] = useState(preselectedId ?? '')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!batteryTypeId) {
      setError('Please select a battery type.')
      return
    }
    setError(null)
    createBattery.mutate(
      { battery_type: batteryTypeId, name: name.trim() || undefined },
      {
        onSuccess: (b) => navigate({ to: '/batteries/$id', params: { id: b.id } }),
      },
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">Deploy Battery</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="battery-type">Battery Type</Label>
          {isLoading ? (
            <div className="h-9 animate-pulse rounded-md bg-[var(--color-muted)]" />
          ) : (
            <select
              id="battery-type"
              value={batteryTypeId}
              onChange={(e) => setBatteryTypeId(e.target.value)}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="">Select a battery type…</option>
              {batteryTypes?.map((bt) => (
                <option key={bt.id} value={bt.id}>
                  {bt.title}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="name">Name (optional)</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Cohort A – May 2026"
          />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {createBattery.isError && (
          <p className="text-xs text-red-500">Failed to deploy. Please try again.</p>
        )}
        <div className="flex gap-2">
          <Button type="submit" disabled={!batteryTypeId || createBattery.isPending}>
            {createBattery.isPending ? 'Deploying…' : 'Deploy'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate({ to: '/batteries' })}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
