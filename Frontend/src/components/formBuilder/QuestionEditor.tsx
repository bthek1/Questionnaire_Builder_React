import { Label } from '@/components/ui/Label'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { SUPPORTED_TYPES } from '@/lib/formBuilder'
import type { BuilderQuestion, FieldType } from '@/lib/formBuilder'

const TYPE_LABELS: Record<FieldType, string> = {
  text: 'Short text',
  comment: 'Long text',
  radiogroup: 'Single choice',
  checkbox: 'Multiple choice',
  dropdown: 'Dropdown',
  rating: 'Rating scale',
  boolean: 'Yes / No',
}

const CHOICE_TYPES: FieldType[] = ['radiogroup', 'checkbox', 'dropdown']

interface QuestionEditorProps {
  question: BuilderQuestion
  onChange: (updated: BuilderQuestion) => void
  /** Whether another question already uses the same name */
  duplicateName?: boolean
}

export function QuestionEditor({ question, onChange, duplicateName }: QuestionEditorProps) {
  function update(patch: Partial<BuilderQuestion>) {
    onChange({ ...question, ...patch })
  }

  function handleTypeChange(value: string) {
    const newType = value as FieldType
    const patch: Partial<BuilderQuestion> = { type: newType }
    if (CHOICE_TYPES.includes(newType) && !question.choices) {
      patch.choices = []
    }
    if (newType === 'rating') {
      patch.rateMin = question.rateMin ?? 1
      patch.rateMax = question.rateMax ?? 5
    }
    update(patch)
  }

  const showChoices = CHOICE_TYPES.includes(question.type)
  const showRating = question.type === 'rating'

  return (
    <div className="space-y-4 rounded-lg border border-[var(--color-border)] p-4">
      {/* Title */}
      <div className="space-y-1">
        <Label htmlFor="q-title">Question text</Label>
        <Input
          id="q-title"
          value={question.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="Enter question text"
        />
      </div>

      {/* Name (unique key) */}
      <div className="space-y-1">
        <Label htmlFor="q-name">Name (unique key)</Label>
        <Input
          id="q-name"
          value={question.name}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="e.g. q1"
          className={duplicateName ? 'border-red-400 focus:ring-red-400' : ''}
        />
        {duplicateName && (
          <p className="text-xs text-red-500" data-testid="duplicate-name-error">
            This name is already used by another question.
          </p>
        )}
      </div>

      {/* Type */}
      <div className="space-y-1">
        <Label>Type</Label>
        <Select value={question.type} onValueChange={handleTypeChange}>
          <SelectTrigger data-testid="type-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Required */}
      <div className="flex items-center gap-2">
        <input
          id="q-required"
          type="checkbox"
          checked={question.required}
          onChange={(e) => update({ required: e.target.checked })}
          className="h-4 w-4"
        />
        <Label htmlFor="q-required">Required</Label>
      </div>

      {/* Choices */}
      {showChoices && (
        <div className="space-y-1">
          <Label htmlFor="q-choices">Choices (one per line)</Label>
          <Textarea
            id="q-choices"
            value={(question.choices ?? []).join('\n')}
            onChange={(e) =>
              update({
                choices: e.target.value
                  .split('\n')
                  .map((s) => s.trimEnd())
                  .filter(Boolean),
              })
            }
            rows={4}
            placeholder="Option A&#10;Option B&#10;Option C"
            data-testid="choices-textarea"
          />
        </div>
      )}

      {/* Rating */}
      {showRating && (
        <div className="flex gap-4">
          <div className="flex-1 space-y-1">
            <Label htmlFor="q-rate-min">Min</Label>
            <Input
              id="q-rate-min"
              type="number"
              value={question.rateMin ?? 1}
              onChange={(e) => update({ rateMin: Number(e.target.value) })}
              data-testid="rate-min-input"
            />
          </div>
          <div className="flex-1 space-y-1">
            <Label htmlFor="q-rate-max">Max</Label>
            <Input
              id="q-rate-max"
              type="number"
              value={question.rateMax ?? 5}
              onChange={(e) => update({ rateMax: Number(e.target.value) })}
              data-testid="rate-max-input"
            />
          </div>
        </div>
      )}
    </div>
  )
}
