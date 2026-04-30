export interface Questionnaire {
  id: string
  title: string
  description?: string
  surveyJson?: object
  createdAt: string
  updatedAt: string
}

export interface QuestionnaireResponse {
  id: string
  questionnaireId: string
  answers: object
  submittedAt: string
}

export interface Answer {
  questionId: string
  value: string | string[]
}
