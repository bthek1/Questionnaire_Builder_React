import { useMemo } from 'react'
import { Model } from 'survey-core'
import { Survey } from 'survey-react-ui'
import 'survey-core/survey-core.min.css'

interface SurveyRendererProps {
  surveyJson: object
  onComplete: (data: object) => void
}

export function SurveyRenderer({ surveyJson, onComplete }: SurveyRendererProps) {
  const model = useMemo(() => {
    const m = new Model(surveyJson)
    m.onComplete.add((sender) => {
      onComplete(sender.data as object)
    })
    return m
  }, [surveyJson, onComplete])

  return <Survey model={model} />
}
