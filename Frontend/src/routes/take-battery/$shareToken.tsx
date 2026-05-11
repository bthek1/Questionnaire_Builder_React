/* eslint-disable react-refresh/only-export-components */
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useBatteryByToken, batteryKeys } from '@/hooks/useBatteries'
import { useQuestionnaireByToken, useSubmitAnswers } from '@/hooks/useQuestionnaires'
import { SurveyRenderer } from '@/components/survey/SurveyRenderer'
import { evaluateMetrics } from '@/lib/metrics'
import type { BatterySlot } from '@/types'

export const Route = createFileRoute('/take-battery/$shareToken')({
  component: TakeBatteryPage,
})

function TakeBatteryPage() {
  const { shareToken } = Route.useParams()
  const { data: battery, isLoading, isError } = useBatteryByToken(shareToken)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const unsubmitted =
    battery?.questionnaires.filter((q) => !q.submittedAt).sort((a, b) => a.order - b.order) ?? []
  const currentSlot: BatterySlot | undefined = unsubmitted[0]

  const handleSlotSubmitted = useCallback(
    (isLast: boolean) => {
      if (isLast) {
        void navigate({ to: '/batteries' })
      } else {
        void queryClient.invalidateQueries({ queryKey: batteryKeys.byToken(shareToken) })
      }
    },
    [navigate, queryClient, shareToken],
  )

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span className="text-[var(--color-muted-foreground)]">Loading battery…</span>
      </div>
    )
  }

  if (isError || !battery) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-red-600 font-medium">Battery not found.</p>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          The link may be invalid or the battery has been removed.
        </p>
      </div>
    )
  }

  if (!currentSlot) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <h1 className="text-2xl font-semibold">All done!</h1>
        <p className="text-[var(--color-muted-foreground)]">
          Thank you — all surveys in this battery are complete.
        </p>
      </div>
    )
  }

  const total = battery.questionnaires.length
  const completed = total - unsubmitted.length
  const isLast = unsubmitted.length === 1

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border bg-[var(--color-card)] px-4 py-3">
        <span className="text-sm font-medium">
          Survey {completed + 1} of {total}
        </span>
        <span className="text-sm text-[var(--color-muted-foreground)]">
          {currentSlot.questionnaireTypeName}
        </span>
      </div>
      <SlotSurvey slot={currentSlot} isLast={isLast} onSubmitted={handleSlotSubmitted} />
    </div>
  )
}

interface SlotSurveyProps {
  slot: BatterySlot
  isLast: boolean
  onSubmitted: (isLast: boolean) => void
}

function SlotSurvey({ slot, isLast, onSubmitted }: SlotSurveyProps) {
  const { data: instance, isLoading } = useQuestionnaireByToken(slot.shareToken)
  const submitAnswers = useSubmitAnswers(slot.shareToken)

  const handleComplete = useCallback(
    (data: object) => {
      const answers = data as Record<string, unknown>
      const questionnaireJson = instance?.questionnaireType?.questionnaireJson
      const metricResults = questionnaireJson ? evaluateMetrics(questionnaireJson, answers) : []
      const metrics = Object.fromEntries(metricResults.map((m) => [m.name, m.value]))
      submitAnswers.mutate({ answers, metrics }, { onSuccess: () => onSubmitted(isLast) })
    },
    [submitAnswers, instance, isLast, onSubmitted],
  )

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="text-[var(--color-muted-foreground)]">Loading survey…</span>
      </div>
    )
  }

  if (!instance) {
    return <p className="text-red-600">Failed to load survey.</p>
  }

  if (submitAnswers.isPending || submitAnswers.isSuccess) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="text-[var(--color-muted-foreground)]">Submitting…</span>
      </div>
    )
  }

  const questionnaireJson = instance.questionnaireType?.questionnaireJson
  if (!questionnaireJson) {
    return <p className="text-red-600">Survey has no questions.</p>
  }

  return <SurveyRenderer surveyJson={questionnaireJson} onComplete={handleComplete} />
}
