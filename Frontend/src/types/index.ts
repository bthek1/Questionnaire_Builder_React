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

export interface BatteryType {
  id: string
  title: string
  description?: string
  questionnaireTypeIds: string[]
  createdAt: string
  updatedAt: string
}

export interface BatterySlot {
  order: number
  questionnaireId: string
  shareToken: string
  questionnaireTypeName: string
  submittedAt: string | null
}

export interface Battery {
  id: string
  batteryTypeId: string
  batteryTypeName: string
  name: string
  shareToken: string
  questionnaires: BatterySlot[]
  isComplete: boolean
  createdAt: string
  updatedAt: string
}
