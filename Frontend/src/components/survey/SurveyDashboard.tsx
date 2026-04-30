import { useMemo } from 'react'
import { Model } from 'survey-core'

interface SurveyDashboardProps {
  surveyJson: object
  responses: object[]
}

interface ChoiceTally {
  type: 'choice'
  title: string
  choices: { text: string; count: number }[]
  total: number
}

interface TextSummary {
  type: 'text'
  title: string
  answers: string[]
}

type QuestionSummary = ChoiceTally | TextSummary

const CHOICE_TYPES = new Set(['radiogroup', 'checkbox', 'dropdown', 'tagbox', 'imagepicker', 'ranking'])

function buildSummaries(surveyJson: object, responses: object[]): QuestionSummary[] {
  if (responses.length === 0) return []
  const model = new Model(surveyJson)
  const questions = model.getAllQuestions()

  return questions.map((q) => {
    const name = q.name
    const title = (q.title as string) || name
    const qType = q.getType()

    if (CHOICE_TYPES.has(qType)) {
      const tally: Record<string, number> = {}
      for (const resp of responses) {
        const val = (resp as Record<string, unknown>)[name]
        const items = Array.isArray(val) ? val : val !== undefined && val !== null ? [val] : []
        for (const item of items) {
          const key = String(item)
          tally[key] = (tally[key] ?? 0) + 1
        }
      }
      const choices = Object.entries(tally).map(([text, count]) => ({ text, count }))
      return { type: 'choice', title, choices, total: responses.length } satisfies ChoiceTally
    }

    const answers: string[] = []
    for (const resp of responses) {
      const val = (resp as Record<string, unknown>)[name]
      if (val !== undefined && val !== null && val !== '') {
        answers.push(typeof val === 'object' ? JSON.stringify(val) : String(val))
      }
    }
    return { type: 'text', title, answers } satisfies TextSummary
  })
}

export function SurveyDashboard({ surveyJson, responses }: SurveyDashboardProps) {
  const summaries = useMemo(() => buildSummaries(surveyJson, responses), [surveyJson, responses])

  if (responses.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-500">No responses yet.</p>
    )
  }

  return (
    <div className="space-y-6">
      {summaries.map((s) => (
        <div key={s.title} className="rounded-lg border p-4">
          <h3 className="mb-3 font-medium">{s.title}</h3>

          {s.type === 'choice' ? (
            <ul className="space-y-2">
              {s.choices.map((c) => {
                const pct = s.total > 0 ? Math.round((c.count / s.total) * 100) : 0
                return (
                  <li key={c.text} className="text-sm">
                    <div className="mb-1 flex justify-between">
                      <span>{c.text}</span>
                      <span className="text-gray-500">
                        {c.count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <ul className="space-y-1 text-sm text-gray-700">
              {s.answers.length === 0 ? (
                <li className="text-gray-400 italic">No answers</li>
              ) : (
                s.answers.map((a, i) => (
                  <li key={i} className="rounded bg-gray-50 px-3 py-1">
                    {a}
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}
