/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import {
  useQuestionnaireByToken,
  useSubmitAnswers,
  usePriorAnswers,
} from '@/hooks/useQuestionnaires'
import { SurveyRenderer } from '@/components/survey/SurveyRenderer'
import { evaluateMetrics } from '@/lib/metrics'

export const Route = createFileRoute('/take/$id')({
  component: TakePage,
})

function TakePage() {
  const { id: shareToken } = Route.useParams()
  const { data: instance, isLoading, isError } = useQuestionnaireByToken(shareToken)
  const { data: priorAnswers } = usePriorAnswers(shareToken)
  const submitAnswers = useSubmitAnswers(shareToken)
  const [submitted, setSubmitted] = useState(false)

  const handleComplete = useCallback(
    (data: object) => {
      const answers = data as Record<string, unknown>
      const questionnaireJson = instance?.questionnaireType?.questionnaireJson
      const metricResults = questionnaireJson ? evaluateMetrics(questionnaireJson, answers) : []
      const metrics = Object.fromEntries(metricResults.map((m) => [m.name, m.value]))
      submitAnswers.mutate(
        { answers, metrics },
        {
          onSuccess: () => setSubmitted(true),
        },
      )
    },
    [submitAnswers, instance],
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

  // Use the live questionnaireJson here — the take page renders the current form for submission.
  // The snapshot (surveyJsonSnapshot) is only used post-submission in the results page
  // to ensure historical answers remain interpretable even if the type definition changes.
  const questionnaireJson = instance.questionnaireType?.questionnaireJson
  if (!questionnaireJson) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-[var(--color-muted-foreground)]">
          This questionnaire has no survey content yet.
        </p>
      </div>
    )
  }

  // Prepend the recipient page (if set) as the first page of the survey.
  // Recipient question names are prefixed `recipient__` to avoid collisions.
  // recipientJson may be either a full page descriptor { name, elements: [...] }
  // or a single element object { type, name, ... } — normalise to a page in both cases.
  const recipientRaw = instance.questionnaireType?.recipientJson
  const recipientPage = recipientRaw
    ? 'elements' in (recipientRaw as Record<string, unknown>)
      ? recipientRaw // already a page descriptor
      : { name: 'recipient_page', elements: [recipientRaw] } // wrap bare element
    : null

  let mergedSurveyJson: object
  if (recipientPage) {
    const mainJson = questionnaireJson as Record<string, unknown>
    // SurveyJS supports two formats: { pages: [...] } or flat { elements: [...] }.
    // When merging, we always produce the pages format. If the survey uses the flat
    // format, promote its elements into a single page so they are not lost.
    const mainPages: unknown[] = Array.isArray(mainJson.pages)
      ? mainJson.pages
      : [{ name: 'page1', elements: mainJson.elements ?? [] }]
    const { elements: _e, pages: _p, ...restJson } = mainJson
    mergedSurveyJson = { ...restJson, pages: [recipientPage, ...mainPages] }
  } else {
    mergedSurveyJson = questionnaireJson
  }

  const title = instance.questionnaireType?.title
  return (
    <div className="max-w-2xl mx-auto">
      {title && <h1 className="mb-6 text-2xl font-semibold">{title}</h1>}
      <SurveyRenderer
        surveyJson={mergedSurveyJson}
        onComplete={handleComplete}
        priorAnswers={priorAnswers}
      />
    </div>
  )
}
