import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCreateQuestionnaire } from '@/hooks/useQuestionnaires'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'

export const Route = createFileRoute('/questionnaires/new')({
  component: NewQuestionnairePage,
})

function NewQuestionnairePage() {
  const navigate = useNavigate()
  const createQuestionnaire = useCreateQuestionnaire()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    setError('')
    const created = await createQuestionnaire.mutateAsync({
      title: title.trim(),
      description: description.trim() || undefined,
    })
    navigate({ to: '/questionnaires/$id/edit', params: { id: created.id } })
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold">New Questionnaire</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Customer Satisfaction Survey"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
          />
        </div>
        <Button type="submit" disabled={createQuestionnaire.isPending}>
          {createQuestionnaire.isPending ? 'Creating…' : 'Create & Open Editor'}
        </Button>
        {createQuestionnaire.isError && (
          <p className="text-xs text-red-500">Failed to create questionnaire. Please try again.</p>
        )}
      </form>
    </div>
  )
}
