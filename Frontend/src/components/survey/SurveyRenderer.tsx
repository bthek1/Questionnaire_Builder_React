/* eslint-disable react-refresh/only-export-components */
import { useMemo } from 'react'
import { Model } from 'survey-core'
import {
  DefaultLight,
  FlatLight,
  PlainLight,
  SharpLight,
  BorderlessLight,
  SolidLight,
} from 'survey-core/themes'
import { Survey } from 'survey-react-ui'
import 'survey-core/survey-core.min.css'
import './survey-theme.css'

type SurveyTheme = typeof DefaultLight

export const SURVEY_THEMES: Record<string, SurveyTheme> = {
  Default: DefaultLight,
  Flat: FlatLight,
  Plain: PlainLight,
  Sharp: SharpLight,
  Borderless: BorderlessLight,
  Solid: SolidLight,
}

export const DEFAULT_THEME_KEY = 'Default'

interface SurveyRendererProps {
  surveyJson: object
  onComplete: (data: object) => void
  /** Named theme key from SURVEY_THEMES. Defaults to 'Default'. */
  theme?: string
  /**
   * Prior answers from the respondent's last submission of this questionnaire type.
   * Each key is injected as a survey variable named `prior_<key>` so that
   * questions can reference `{prior_<key>}` in `defaultValueExpression`.
   */
  priorAnswers?: Record<string, unknown>
}

export function SurveyRenderer({
  surveyJson,
  onComplete,
  theme = DEFAULT_THEME_KEY,
  priorAnswers,
}: SurveyRendererProps) {
  const model = useMemo(() => {
    const m = new Model(surveyJson)
    m.onComplete.add((sender) => {
      onComplete(sender.data as object)
    })
    // Inject prior answers as survey variables so defaultValueExpression can reference them.
    if (priorAnswers) {
      Object.entries(priorAnswers).forEach(([key, value]) => {
        m.setVariable(`prior_${key}`, value as string | number | boolean)
      })
    }
    // Per-survey themeJson embedded in surveyJson takes priority over the theme prop.
    const json = surveyJson as Record<string, unknown>
    if (json.themeJson && typeof json.themeJson === 'object') {
      m.applyTheme(json.themeJson as SurveyTheme)
    } else {
      m.applyTheme(SURVEY_THEMES[theme] ?? DefaultLight)
    }
    return m
  }, [surveyJson, onComplete, theme, priorAnswers])

  return <Survey model={model} />
}
