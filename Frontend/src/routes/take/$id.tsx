/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import { useQuestionnaireByToken, useSubmitAnswers } from '@/hooks/useQuestionnaires'
import { SurveyRenderer } from '@/components/survey/SurveyRenderer'

export const Route = createFileRoute('/take/$id')({
  component: TakePage,
})

function TakePage() {
  const { id: shareToken } = Route.useParams()
  const { data: instance, isLoading, isError } = useQuestionnaireByToken(shareToken)
  const submitAnswers = useSubmitAnswers(shareToken)
  const [submitted, setSubmitted] = useState(false)

  const handleComplete = useCallback(
    (data: object) => {
      submitAnswers.mutate(data as Record<string, unknown>, {
        onSuccess: () => setSubmitted(true),
      })
    },
    [submitAnswers],
  )

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span className="text-[var(--color-muted-foreground)]">Loading questionnaire…</span>
      </div>
    )
  }

  if (isError || !instance) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-red-600 font-medium">Questionnaire not found.</p>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          The link may be invalid or the questionnaire has been removed.
        </p>
      </div>
    )
  }

  if (instance.submittedAt) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <h1 className="text-2xl font-semibold">Already submitted</h1>
        <p className="text-[var(--color-muted-foreground)]">
          This questionnaire has already been completed.
        </p>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <h1 className="text-2xl font-semibold">Thank you!</h1>
        <p className="text-[var(--color-muted-foreground)]">
          You have completed{' '}
          <span className="font-medium">
            {instance.questionnaireType?.title ?? 'the questionnaire'}
          </span>
          .
        </p>
      </div>
    )
  }

  if (submitAnswers.isError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-red-600 font-medium">Something went wrong submitting your response.</p>
        <button
          className="text-sm underline text-[var(--color-primary)] hover:brightness-75"
          onClick={() => submitAnswers.reset()}
        >
          Try again
        </button>
      </div>
    )
  }

  const surveyJson = instance.questionnaireType?.surveyJson
  if (!surveyJson) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-[var(--color-muted-foreground)]">
          This questionnaire has no survey content yet.
        </p>
      </div>
    )
  }

  const title = instance.questionnaireType?.title
  return (
    <div className="max-w-2xl mx-auto">
      {title && <h1 className="mb-6 text-2xl font-semibold">{title}</h1>}
      <SurveyRenderer surveyJson={surveyJson} onComplete={handleComplete} />
    </div>
  )
}

