import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusCircle, Trash2 } from 'lucide-react'
import { createQuestionnaire } from '@/api/questionnaires'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { Separator } from '@/components/ui/Separator'
import { Textarea } from '@/components/ui/Textarea'
import { required, minLength, compose } from '@/lib/form'
import type { Question, QuestionOption } from '@/types'

type QuestionDraft = Omit<Question, 'id'> & { options: QuestionOption[] }

interface FormValues {
  title: string
  description: string
  questions: QuestionDraft[]
}

const defaultQuestion = (): QuestionDraft => ({
  text: '',
  type: 'text',
  required: false,
  options: [],
})

function FieldError({ error }: { error?: string }) {
  if (!error) return null
  return <p className="mt-1 text-xs text-red-500">{error}</p>
}

export function QuestionnaireForm() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: createQuestionnaire,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionnaires'] })
    },
  })

  const form = useForm<FormValues>({
    defaultValues: {
      title: '',
      description: '',
      questions: [],
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({
        title: value.title,
        description: value.description || undefined,
        questions: value.questions.map((q, i) => ({
          id: `q-${i}`,
          ...q,
          options: q.options.map((o, j) => ({ ...o, id: `o-${i}-${j}` })),
        })),
      })
      form.reset()
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="space-y-6"
    >
      {/* Title */}
      <div className="space-y-1.5">
        <form.Field
          name="title"
          validators={{ onChange: compose(required, minLength(3)) }}
        >
          {(field) => (
            <>
              <Label htmlFor={field.name}>Title *</Label>
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="e.g. Customer Satisfaction Survey"
              />
              <FieldError error={field.state.meta.errors[0]?.toString()} />
            </>
          )}
        </form.Field>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <form.Field name="description">
          {(field) => (
            <>
              <Label htmlFor={field.name}>Description</Label>
              <Textarea
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Optional description of this questionnaire"
              />
            </>
          )}
        </form.Field>
      </div>

      <Separator />

      {/* Questions */}
      <form.Field name="questions" mode="array">
        {(questionsField) => (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Questions</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => questionsField.pushValue(defaultQuestion())}
              >
                <PlusCircle className="mr-1.5 h-4 w-4" />
                Add Question
              </Button>
            </div>

            {questionsField.state.value.length === 0 && (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                No questions yet. Click "Add Question" to get started.
              </p>
            )}

            {questionsField.state.value.map((_, questionIndex) => (
              <div
                key={questionIndex}
                className="rounded border border-[var(--color-border)] p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--color-muted-foreground)]">
                    Question {questionIndex + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => questionsField.removeValue(questionIndex)}
                    aria-label="Remove question"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>

                {/* Question text */}
                <div className="space-y-1.5">
                  <form.Field
                    name={`questions[${questionIndex}].text`}
                    validators={{ onChange: required }}
                  >
                    {(field) => (
                      <>
                        <Label htmlFor={field.name}>Question text *</Label>
                        <Input
                          id={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Enter your question"
                        />
                        <FieldError error={field.state.meta.errors[0]?.toString()} />
                      </>
                    )}
                  </form.Field>
                </div>

                {/* Question type */}
                <div className="space-y-1.5">
                  <form.Field name={`questions[${questionIndex}].type`}>
                    {(field) => (
                      <>
                        <Label>Type</Label>
                        <Select
                          value={field.state.value}
                          onValueChange={(v) =>
                            field.handleChange(v as Question['type'])
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="single_choice">Single choice</SelectItem>
                            <SelectItem value="multiple_choice">Multiple choice</SelectItem>
                            <SelectItem value="rating">Rating</SelectItem>
                          </SelectContent>
                        </Select>
                      </>
                    )}
                  </form.Field>
                </div>

                {/* Required toggle */}
                <div className="flex items-center gap-2">
                  <form.Field name={`questions[${questionIndex}].required`}>
                    {(field) => (
                      <>
                        <input
                          id={`${field.name}-required`}
                          type="checkbox"
                          checked={field.state.value}
                          onChange={(e) => field.handleChange(e.target.checked)}
                          className="h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-primary)]"
                        />
                        <Label htmlFor={`${field.name}-required`}>Required</Label>
                      </>
                    )}
                  </form.Field>
                </div>

                {/* Options (for choice question types) */}
                <form.Subscribe
                  selector={(state) =>
                    (state.values.questions[questionIndex]?.type as Question['type']) ?? 'text'
                  }
                >
                  {(type) =>
                    (type === 'single_choice' || type === 'multiple_choice') && (
                      <form.Field name={`questions[${questionIndex}].options`} mode="array">
                        {(optionsField) => (
                          <div className="space-y-2 pl-4 border-l border-[var(--color-border)]">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
                                Options
                              </Label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  optionsField.pushValue({
                                    id: '',
                                    label: '',
                                    value: '',
                                  })
                                }
                              >
                                <PlusCircle className="mr-1 h-3.5 w-3.5" />
                                Add option
                              </Button>
                            </div>

                            {optionsField.state.value.map((_, optionIndex) => (
                              <div key={optionIndex} className="flex items-center gap-2">
                                <form.Field
                                  name={`questions[${questionIndex}].options[${optionIndex}].label`}
                                  validators={{ onChange: required }}
                                >
                                  {(field) => (
                                    <div className="flex-1 space-y-1">
                                      <Input
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => {
                                          const label = e.target.value
                                          field.handleChange(label)
                                          // keep value in sync with label
                                          form.setFieldValue(
                                            `questions[${questionIndex}].options[${optionIndex}].value`,
                                            label.toLowerCase().replace(/\s+/g, '_'),
                                          )
                                        }}
                                        placeholder={`Option ${optionIndex + 1}`}
                                      />
                                      <FieldError
                                        error={field.state.meta.errors[0]?.toString()}
                                      />
                                    </div>
                                  )}
                                </form.Field>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => optionsField.removeValue(optionIndex)}
                                  aria-label="Remove option"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </form.Field>
                    )
                  }
                </form.Subscribe>
              </div>
            ))}
          </div>
        )}
      </form.Field>

      {/* Submission */}
      {mutation.isError && (
        <p className="text-sm text-red-500">
          {(mutation.error as Error).message}
        </p>
      )}

      {mutation.isSuccess && (
        <p className="text-sm text-green-600">Questionnaire created successfully!</p>
      )}

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? 'Saving…' : 'Create Questionnaire'}
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
