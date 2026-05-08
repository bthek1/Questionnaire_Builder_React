/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useBatteryType, useUpdateBatteryType } from '@/hooks/useBatteryTypes'
import { useQuestionnaireTypes } from '@/hooks/useQuestionnaireTypes'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import type { BatteryType } from '@/types'
import type { QuestionnaireType } from '@/types'

export const Route = createFileRoute('/battery-types/$id')({
  component: BatteryTypeEditPage,
})

function BatteryTypeEditPage() {
  const { id } = Route.useParams()
  const { data: batteryType, isLoading } = useBatteryType(id)
  const { data: allTypes } = useQuestionnaireTypes()

  if (isLoading) {
    return <div className="h-32 animate-pulse rounded-lg bg-[var(--color-muted)]" />
  }

  if (!batteryType) {
    return <p className="text-[var(--color-muted-foreground)]">Battery type not found.</p>
  }

  return (
    <BatteryTypeForm
      key={batteryType.id}
      batteryType={batteryType}
      allTypes={allTypes ?? []}
    />
  )
}

function BatteryTypeForm({
  batteryType,
  allTypes,
}: {
  batteryType: BatteryType
  allTypes: QuestionnaireType[]
}) {
  const navigate = useNavigate()
  const updateBatteryType = useUpdateBatteryType(batteryType.id)

  const [title, setTitle] = useState(batteryType.title)
  const [description, setDescription] = useState(batteryType.description ?? '')
  const [selectedIds, setSelectedIds] = useState<string[]>(batteryType.questionnaireTypeIds)

  function addType(qtId: string) {
    if (!selectedIds.includes(qtId)) {
      setSelectedIds((prev) => [...prev, qtId])
    }
  }

  function removeType(index: number) {
    setSelectedIds((prev) => prev.filter((_, i) => i !== index))
  }

  function moveUp(index: number) {
    if (index === 0) return
    setSelectedIds((prev) => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next
    })
  }

  function moveDown(index: number) {
    setSelectedIds((prev) => {
      if (index === prev.length - 1) return prev
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next
    })
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    updateBatteryType.mutate(
      { title: title.trim(), description: description.trim() || undefined, questionnaireTypeIds: selectedIds },
      { onSuccess: () => navigate({ to: '/battery-types' }) },
    )
  }

  const availableToAdd = allTypes.filter((t) => !selectedIds.includes(t.id))

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Edit Battery Type</h1>
      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label>Questionnaire Types (in order)</Label>
          {selectedIds.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              No surveys added yet.
            </p>
          ) : (
            <div className="space-y-1">
              {selectedIds.map((qtId, index) => {
                const qt = allTypes.find((t) => t.id === qtId)
                return (
                  <div
                    key={qtId}
                    className="flex items-center gap-2 rounded border px-3 py-2 text-sm bg-[var(--color-card)]"
                  >
                    <span className="flex-1">{qt?.title ?? qtId}</span>
                    <Button type="button" size="sm" variant="outline" onClick={() => moveUp(index)}>
                      ↑
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => moveDown(index)}>
                      ↓
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => removeType(index)}
                    >
                      Remove
                    </Button>
                  </div>
                )
              })}
            </div>
          )}

          {availableToAdd.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                id="add-type-select"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    addType(e.target.value)
                    e.target.value = ''
                  }
                }}
                className="flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                <option value="">Add a survey…</option>
                {availableToAdd.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {updateBatteryType.isError && (
          <p className="text-xs text-red-500">Failed to save. Please try again.</p>
        )}
        <div className="flex gap-2">
          <Button type="submit" disabled={!title.trim() || updateBatteryType.isPending}>
            {updateBatteryType.isPending ? 'Saving…' : 'Save'}
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
