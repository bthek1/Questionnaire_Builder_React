export interface Questionnaire {
  id: string
  title: string
  description?: string
  surveyJson?: object
  questions: Question[]
  createdAt: string
  updatedAt: string
}

export interface Question {
  id: string
  text: string
  type: 'text' | 'single_choice' | 'multiple_choice' | 'rating'
  required: boolean
  options?: QuestionOption[]
}

export interface QuestionOption {
  id: string
  label: string
  value: string
}

export interface QuestionnaireResponse {
  id: string
  questionnaireId: string
  answers: Answer[]
  submittedAt: string
}

export interface Answer {
  questionId: string
  value: string | string[]
}
