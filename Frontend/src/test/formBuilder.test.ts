import { parseSurveyJson, buildSurveyJson, generateUniqueName } from '@/lib/formBuilder'
import type { BuilderSurvey, BuilderQuestion, AdvancedQuestion } from '@/lib/formBuilder'

// ---------------------------------------------------------------------------
// parseSurveyJson
// ---------------------------------------------------------------------------

describe('parseSurveyJson', () => {
  it('returns empty survey for minimal valid JSON', () => {
    const result = parseSurveyJson({ pages: [{ name: 'page1', elements: [] }] })
    expect(result.title).toBe('')
    expect(result.questions).toHaveLength(0)
  })

  it('parses survey title', () => {
    const result = parseSurveyJson({ title: 'My Survey', pages: [] })
    expect(result.title).toBe('My Survey')
  })

  it('parses a text question', () => {
    const json = {
      pages: [
        {
          name: 'page1',
          elements: [{ type: 'text', name: 'q1', title: 'Your name', isRequired: true }],
        },
      ],
    }
    const result = parseSurveyJson(json)
    expect(result.questions).toHaveLength(1)
    const q = result.questions[0] as BuilderQuestion
    expect(q.type).toBe('text')
    expect(q.name).toBe('q1')
    expect(q.title).toBe('Your name')
    expect(q.required).toBe(true)
  })

  it('parses a radiogroup question with string choices', () => {
    const json = {
      pages: [
        {
          name: 'page1',
          elements: [
            {
              type: 'radiogroup',
              name: 'q2',
              title: 'Favourite colour',
              choices: ['Red', 'Green', 'Blue'],
            },
          ],
        },
      ],
    }
    const result = parseSurveyJson(json)
    const q = result.questions[0] as BuilderQuestion
    expect(q.type).toBe('radiogroup')
    expect(q.choices).toEqual(['Red', 'Green', 'Blue'])
  })

  it('parses a radiogroup question with {value, text} object choices', () => {
    const json = {
      pages: [
        {
          name: 'page1',
          elements: [
            {
              type: 'radiogroup',
              name: 'q3',
              choices: [
                { value: 'r', text: 'Red' },
                { value: 'g', text: 'Green' },
              ],
            },
          ],
        },
      ],
    }
    const result = parseSurveyJson(json)
    const q = result.questions[0] as BuilderQuestion
    expect(q.choices).toEqual(['Red', 'Green'])
  })

  it('parses a rating question with rateMin/rateMax', () => {
    const json = {
      pages: [
        {
          name: 'page1',
          elements: [{ type: 'rating', name: 'q4', title: 'Rate us', rateMin: 0, rateMax: 10 }],
        },
      ],
    }
    const result = parseSurveyJson(json)
    const q = result.questions[0] as BuilderQuestion
    expect(q.type).toBe('rating')
    expect(q.rateMin).toBe(0)
    expect(q.rateMax).toBe(10)
  })

  it('uses default rateMin/rateMax when not provided', () => {
    const json = {
      pages: [{ name: 'page1', elements: [{ type: 'rating', name: 'q5' }] }],
    }
    const result = parseSurveyJson(json)
    const q = result.questions[0] as BuilderQuestion
    expect(q.rateMin).toBe(1)
    expect(q.rateMax).toBe(5)
  })

  it('marks unsupported types as advanced', () => {
    const raw = { type: 'matrix', name: 'mx1', rows: ['r1'], columns: ['c1'] }
    const json = { pages: [{ name: 'page1', elements: [raw] }] }
    const result = parseSurveyJson(json)
    const q = result.questions[0] as AdvancedQuestion
    expect(q._advanced).toBe(true)
    expect(q.type).toBe('matrix')
    expect(q.raw).toEqual(raw)
  })

  it('collects elements across multiple pages', () => {
    const json = {
      pages: [
        { name: 'p1', elements: [{ type: 'text', name: 'q1' }] },
        { name: 'p2', elements: [{ type: 'text', name: 'q2' }] },
      ],
    }
    const result = parseSurveyJson(json)
    expect(result.questions).toHaveLength(2)
  })

  it('handles missing pages gracefully', () => {
    const result = parseSurveyJson({})
    expect(result.questions).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// buildSurveyJson
// ---------------------------------------------------------------------------

describe('buildSurveyJson', () => {
  it('produces minimal valid JSON for empty survey', () => {
    const survey: BuilderSurvey = { title: '', questions: [] }
    const result = buildSurveyJson(survey) as Record<string, unknown>
    expect(result.pages).toBeDefined()
    const pages = result.pages as Array<{ name: string; elements: unknown[] }>
    expect(pages[0].name).toBe('page1')
    expect(pages[0].elements).toHaveLength(0)
  })

  it('includes survey title when non-empty', () => {
    const survey: BuilderSurvey = { title: 'Hello', questions: [] }
    const result = buildSurveyJson(survey) as Record<string, unknown>
    expect(result.title).toBe('Hello')
  })

  it('omits title key when empty', () => {
    const survey: BuilderSurvey = { title: '', questions: [] }
    const result = buildSurveyJson(survey) as Record<string, unknown>
    expect(result.title).toBeUndefined()
  })

  it('serialises a text question correctly', () => {
    const survey: BuilderSurvey = {
      title: '',
      questions: [{ name: 'q1', title: 'Name', type: 'text', required: true }],
    }
    const result = buildSurveyJson(survey) as { pages: Array<{ elements: unknown[] }> }
    const el = result.pages[0].elements[0] as Record<string, unknown>
    expect(el.type).toBe('text')
    expect(el.name).toBe('q1')
    expect(el.title).toBe('Name')
    expect(el.isRequired).toBe(true)
  })

  it('omits isRequired when false', () => {
    const survey: BuilderSurvey = {
      title: '',
      questions: [{ name: 'q1', title: 'Name', type: 'text', required: false }],
    }
    const result = buildSurveyJson(survey) as { pages: Array<{ elements: unknown[] }> }
    const el = result.pages[0].elements[0] as Record<string, unknown>
    expect(el.isRequired).toBeUndefined()
  })

  it('includes choices for radiogroup', () => {
    const survey: BuilderSurvey = {
      title: '',
      questions: [
        { name: 'q1', title: 'Pick', type: 'radiogroup', required: false, choices: ['A', 'B'] },
      ],
    }
    const result = buildSurveyJson(survey) as { pages: Array<{ elements: unknown[] }> }
    const el = result.pages[0].elements[0] as Record<string, unknown>
    expect(el.choices).toEqual(['A', 'B'])
  })

  it('includes rateMin/rateMax for rating', () => {
    const survey: BuilderSurvey = {
      title: '',
      questions: [
        { name: 'q1', title: 'Rate', type: 'rating', required: false, rateMin: 0, rateMax: 10 },
      ],
    }
    const result = buildSurveyJson(survey) as { pages: Array<{ elements: unknown[] }> }
    const el = result.pages[0].elements[0] as Record<string, unknown>
    expect(el.rateMin).toBe(0)
    expect(el.rateMax).toBe(10)
  })

  it('preserves advanced questions verbatim', () => {
    const raw = { type: 'matrix', name: 'mx1', rows: ['r1'], columns: ['c1'] }
    const survey: BuilderSurvey = {
      title: '',
      questions: [{ _advanced: true, name: 'mx1', type: 'matrix', raw }],
    }
    const result = buildSurveyJson(survey) as { pages: Array<{ elements: unknown[] }> }
    expect(result.pages[0].elements[0]).toEqual(raw)
  })
})

// ---------------------------------------------------------------------------
// Round-trip
// ---------------------------------------------------------------------------

describe('round-trip parseSurveyJson → buildSurveyJson', () => {
  it('preserves all supported question types', () => {
    const original = {
      title: 'Survey',
      pages: [
        {
          name: 'page1',
          elements: [
            { type: 'text', name: 'q1', title: 'Name', isRequired: true },
            { type: 'rating', name: 'q2', title: 'Rate', rateMin: 1, rateMax: 5 },
            { type: 'radiogroup', name: 'q3', title: 'Pick', choices: ['A', 'B'] },
            { type: 'checkbox', name: 'q4', title: 'Select', choices: ['X', 'Y'] },
            { type: 'dropdown', name: 'q5', title: 'Choose', choices: ['P', 'Q'] },
            { type: 'comment', name: 'q6', title: 'Notes' },
            { type: 'boolean', name: 'q7', title: 'Agree' },
          ],
        },
      ],
    }

    const parsed = parseSurveyJson(original)
    const rebuilt = buildSurveyJson(parsed) as {
      title: string
      pages: Array<{ elements: Array<Record<string, unknown>> }>
    }

    expect(rebuilt.title).toBe('Survey')
    expect(rebuilt.pages[0].elements).toHaveLength(7)
    expect(rebuilt.pages[0].elements[0].type).toBe('text')
    expect(rebuilt.pages[0].elements[2].choices).toEqual(['A', 'B'])
  })
})

// ---------------------------------------------------------------------------
// generateUniqueName
// ---------------------------------------------------------------------------

describe('generateUniqueName', () => {
  it('returns q1 when no existing names', () => {
    expect(generateUniqueName([])).toBe('q1')
  })

  it('skips names already in use', () => {
    expect(generateUniqueName(['q1', 'q2'])).toBe('q3')
  })

  it('fills gaps', () => {
    expect(generateUniqueName(['q1', 'q3'])).toBe('q2')
  })
})
