import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import { useQuestionnaireType } from '@/hooks/useQuestionnaires'
import { useSubmitResponse } from '@/hooks/useResponses'
import { SurveyRenderer } from '@/components/survey/SurveyRenderer'

export const Route = createFileRoute('/take/$id')({
  component: TakePage,
})

function TakePage() {
  const { id } = Route.useParams()
  const { data: questionnaire, isLoading, isError } = useQuestionnaireType(id)
  const submitResponse = useSubmitResponse(id)
  const [submitted, setSubmitted] = useState(false)

  const handleComplete = useCallback(
    (data: object) => {
      submitResponse.mutate(data, {
        onSuccess: () => setSubmitted(true),
      })
    },
    [submitResponse],
  )

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span className="text-[var(--color-muted-foreground)]">Loading questionnaire…</span>
      </div>
    )
  }

  if (isError || !questionnaire) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-red-600 font-medium">Questionnaire not found.</p>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          The link may be invalid or the questionnaire has been removed.
        </p>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <h1 className="text-2xl font-semibold">Thank you!</h1>
        <p className="text-[var(--color-muted-foreground)]">
          You have completed <span className="font-medium">{questionnaire.title}</span>.
        </p>
      </div>
    )
  }

  if (submitResponse.isError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-red-600 font-medium">Something went wrong submitting your response.</p>
        <button
          className="text-sm underline text-[var(--color-primary)] hover:brightness-75"
          onClick={() => submitResponse.reset()}
        >
          Try again
        </button>
      </div>
    )
  }

  if (!questionnaire.surveyJson) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-[var(--color-muted-foreground)]">
          This questionnaire has no survey content yet.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="mb-6 text-2xl font-semibold">{questionnaire.title}</h1>
      <SurveyRenderer surveyJson={questionnaire.surveyJson} onComplete={handleComplete} />
    </div>
  )
}
