/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react'
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { z } from 'zod'
import { useQuestionnaireTypes } from '@/hooks/useQuestionnaireTypes'
import { useCreateQuestionnaire } from '@/hooks/useQuestionnaires'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'

const searchSchema = z.object({
  typeId: z.string().optional(),
})

export const Route = createFileRoute('/questionnaires/new')({
  validateSearch: searchSchema,
  component: NewQuestionnairePage,
})

function NewQuestionnairePage() {
  const navigate = useNavigate()
  const { typeId: preselectedTypeId } = useSearch({ from: '/questionnaires/new' })
  const { data: types, isLoading: typesLoading } = useQuestionnaireTypes()
  const createQuestionnaire = useCreateQuestionnaire()

  const [typeId, setTypeId] = useState(preselectedTypeId ?? '')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!typeId) {
      setError('Please select a questionnaire type.')
      return
    }
    setError(null)
    createQuestionnaire.mutate(
      { questionnaireTypeId: typeId, name: name.trim() || undefined },
      {
        onSuccess: () => navigate({ to: '/questionnaires' }),
      },
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">New Deployment</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="type">Questionnaire Type</Label>
          {typesLoading ? (
            <div className="h-9 animate-pulse rounded-md bg-[var(--color-muted)]" />
          ) : (
            <select
              id="type"
              value={typeId}
              onChange={(e) => setTypeId(e.target.value)}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="">Select a type…</option>
              {types?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
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
            placeholder="e.g. John Doe – April 2026"
          />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {createQuestionnaire.isError && (
          <p className="text-xs text-red-500">Failed to create. Please try again.</p>
        )}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: '/questionnaires' })}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createQuestionnaire.isPending}>
            {createQuestionnaire.isPending ? 'Creating…' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  )
}

