/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCreateBatteryType } from '@/hooks/useBatteryTypes'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'

export const Route = createFileRoute('/battery-types/new')({
  component: NewBatteryTypePage,
})

function NewBatteryTypePage() {
  const navigate = useNavigate()
  const createBatteryType = useCreateBatteryType()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    createBatteryType.mutate(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        questionnaireTypeIds: [],
      },
      {
        onSuccess: (bt) => navigate({ to: '/battery-types/$id', params: { id: bt.id } }),
      },
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">New Battery Type</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Onboarding Assessment"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description…"
            rows={3}
          />
        </div>
        {createBatteryType.isError && (
          <p className="text-xs text-red-500">Failed to create. Please try again.</p>
        )}
        <div className="flex gap-2">
          <Button type="submit" disabled={!title.trim() || createBatteryType.isPending}>
            {createBatteryType.isPending ? 'Creating…' : 'Create & Add Surveys'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: '/battery-types' })}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
