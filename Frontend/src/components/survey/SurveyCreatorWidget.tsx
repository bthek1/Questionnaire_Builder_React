import { useState } from 'react'
import { ICreatorOptions, SurveyCreator } from 'survey-creator-core'
import { SurveyCreatorComponent } from 'survey-creator-react'
import { updateQuestionnaire } from '@/api/questionnaires'
import 'survey-core/survey-core.css'
import 'survey-creator-core/survey-creator-core.css'

const DEFAULT_OPTIONS: ICreatorOptions = {
  autoSaveEnabled: true,
  showLogicTab: true,
  showThemeTab: true,
  haveCommercialLicense: true,
}

interface Props {
  questionnaireId: string
  initialJson?: object
}

export default function SurveyCreatorWidget({ questionnaireId, initialJson }: Props) {
  const [creator] = useState(() => {
    const c = new SurveyCreator(DEFAULT_OPTIONS)

    if (initialJson) {
      c.JSON = initialJson
    }

    c.saveSurveyFunc = (saveNo: number, callback: (no: number, success: boolean) => void) => {
      updateQuestionnaire(questionnaireId, { surveyJson: c.JSON })
        .then(() => callback(saveNo, true))
        .catch(() => callback(saveNo, false))
    }

    return c
  })

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <SurveyCreatorComponent creator={creator} />
    </div>
  )
}
