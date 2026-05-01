export interface QuestionnaireType {
  id: string
  title: string
  description?: string
  surveyJson?: object
  createdAt: string
  updatedAt: string
}

export interface Questionnaire {
  id: string
  questionnaireTypeId: string
  questionnaireType?: QuestionnaireType
  name: string
  shareToken: string
  answers: Record<string, unknown>
  metrics?: Record<string, unknown>
  submittedAt: string | null
  surveyJsonSnapshot?: object
  createdAt: string
  updatedAt: string
}
