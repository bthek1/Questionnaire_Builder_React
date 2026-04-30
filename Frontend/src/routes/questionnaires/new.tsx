import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ClipboardList, Star, MessageSquare, HelpCircle, FileText } from 'lucide-react'
import { useCreateQuestionnaire } from '@/hooks/useQuestionnaires'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'

export const Route = createFileRoute('/questionnaires/new')({
  component: NewQuestionnairePage,
})

const TITLE_MAX = 120

interface Template {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  surveyJson: object
}

const TEMPLATES: Template[] = [
  {
    id: 'blank',
    label: 'Blank',
    description: 'Start from scratch',
    icon: <FileText className="h-5 w-5" />,
    surveyJson: { pages: [{ name: 'page1', elements: [] }] },
  },
  {
    id: 'satisfaction',
    label: 'Customer Satisfaction',
    description: 'NPS + open feedback',
    icon: <Star className="h-5 w-5" />,
    surveyJson: {
      pages: [
        {
          name: 'page1',
          elements: [
            {
              type: 'rating',
              name: 'nps',
              title: 'How likely are you to recommend us?',
              rateMin: 0,
              rateMax: 10,
              minRateDescription: 'Not likely',
              maxRateDescription: 'Extremely likely',
            },
            {
              type: 'comment',
              name: 'feedback',
              title: 'What could we do better?',
              isRequired: false,
            },
          ],
        },
      ],
    },
  },
  {
    id: 'feedback',
    label: 'Event Feedback',
    description: 'Rating + comments',
    icon: <MessageSquare className="h-5 w-5" />,
    surveyJson: {
      pages: [
        {
          name: 'page1',
          elements: [
            {
              type: 'rating',
              name: 'overall',
              title: 'How would you rate the overall event?',
              rateValues: [1, 2, 3, 4, 5],
            },
            {
              type: 'checkbox',
              name: 'highlights',
              title: 'What did you enjoy most?',
              choices: ['Content', 'Networking', 'Speakers', 'Venue'],
            },
            { type: 'comment', name: 'suggestions', title: 'Any suggestions for next time?' },
          ],
        },
      ],
    },
  },
  {
    id: 'quiz',
    label: 'Quiz',
    description: 'Multiple-choice questions',
    icon: <HelpCircle className="h-5 w-5" />,
    surveyJson: {
      pages: [
        {
          name: 'page1',
          elements: [
            {
              type: 'radiogroup',
              name: 'q1',
              title: 'Sample question — edit me',
              choices: ['Option A', 'Option B', 'Option C'],
              correctAnswer: 'Option A',
            },
          ],
        },
      ],
      showProgressBar: 'top',
    },
  },
]

function NewQuestionnairePage() {
  const navigate = useNavigate()
  const createQuestionnaire = useCreateQuestionnaire()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('blank')
  const [titleTouched, setTitleTouched] = useState(false)

  const titleError =
    titleTouched && !title.trim()
      ? 'Title is required'
      : title.length > TITLE_MAX
        ? `Title must be ${TITLE_MAX} characters or fewer`
        : ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTitleTouched(true)
    if (!title.trim() || title.length > TITLE_MAX) return

    const template = TEMPLATES.find((t) => t.id === selectedTemplate)
    const created = await createQuestionnaire.mutateAsync({
      title: title.trim(),
      description: description.trim() || undefined,
      surveyJson: template?.surveyJson,
    })
    navigate({ to: '/questionnaires/$id/json', params: { id: created.id } })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
          <ClipboardList className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">New Questionnaire</h1>
          <p className="text-sm text-gray-500">Fill in the details and pick a starting template</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Details card */}
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-medium uppercase tracking-wide text-gray-400">Details</h2>

          <div className="space-y-1.5">
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setTitleTouched(true)}
              placeholder="e.g. Customer Satisfaction Survey"
              className={titleError ? 'border-red-400 focus:ring-red-400' : ''}
              maxLength={TITLE_MAX + 1}
              autoFocus
            />
            <div className="flex items-center justify-between">
              {titleError ? (
                <p className="text-xs text-red-500">{titleError}</p>
              ) : (
                <span />
              )}
              <p className={`text-xs ${title.length > TITLE_MAX ? 'text-red-500' : 'text-gray-400'}`}>
                {title.length}/{TITLE_MAX}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional — briefly describe the purpose of this questionnaire"
              rows={3}
            />
          </div>
        </div>

        {/* Template picker card */}
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-wide text-gray-400">
            Starting Template
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTemplate(t.id)}
                className={`flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${
                  selectedTemplate === t.id
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 ring-1 ring-[var(--color-primary)]'
                    : 'border-gray-200'
                }`}
              >
                <span
                  className={`${selectedTemplate === t.id ? 'text-[var(--color-primary)]' : 'text-gray-500'}`}
                >
                  {t.icon}
                </span>
                <span className="text-sm font-medium">{t.label}</span>
                <span className="text-xs text-gray-500">{t.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button asChild variant="outline">
            <Link to="/questionnaires">Cancel</Link>
          </Button>
          <Button type="submit" disabled={createQuestionnaire.isPending}>
            {createQuestionnaire.isPending ? 'Creating…' : 'Create & Open Editor'}
          </Button>
        </div>

        {createQuestionnaire.isError && (
          <p className="text-xs text-red-500 text-right">
            Failed to create questionnaire. Please try again.
          </p>
        )}
      </form>
    </div>
  )
}
