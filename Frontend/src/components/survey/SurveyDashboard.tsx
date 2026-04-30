import { useEffect, useRef } from 'react'
import { Model } from 'survey-core'
import { VisualizationPanel } from 'survey-analytics'
import 'survey-analytics/survey.analytics.css'

interface SurveyDashboardProps {
  surveyJson: object
  responses: object[]
}

export function SurveyDashboard({ surveyJson, responses }: SurveyDashboardProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const survey = new Model(surveyJson)
    const panel = new VisualizationPanel(survey.getAllQuestions(), responses, {
      allowHideQuestions: true,
    })

    panel.render(containerRef.current)

    return () => {
      panel.clear()
    }
  }, [surveyJson, responses])

  return <div ref={containerRef} />
}
