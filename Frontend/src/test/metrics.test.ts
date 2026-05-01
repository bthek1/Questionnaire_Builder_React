import { vi } from 'vitest'

// Mock survey-core before importing metrics
const modelState = vi.hoisted(() => ({
  calcValues: [] as Array<{ name: string; value: unknown }>,
  data: {} as Record<string, unknown>,
}))

vi.mock('survey-core', () => ({
  Model: class {
    set data(val: Record<string, unknown>) {
      modelState.data = val
    }
    get data() {
      return modelState.data
    }
    get calculatedValues() {
      return modelState.calcValues
    }
    constructor(_json: unknown) {} // eslint-disable-line @typescript-eslint/no-unused-vars
  },
}))

import { formatLabel, evaluateMetrics, metricsFromStored } from '@/lib/metrics'

beforeEach(() => {
  modelState.calcValues = []
  modelState.data = {}
})

describe('formatLabel()', () => {
  it('converts snake_case to Title Case', () => {
    expect(formatLabel('total_score')).toBe('Total Score')
  })

  it('converts camelCase to Title Case', () => {
    expect(formatLabel('bonusPoints')).toBe('Bonus Points')
  })

  it('handles single word', () => {
    expect(formatLabel('score')).toBe('Score')
  })
})

describe('evaluateMetrics()', () => {
  it('returns empty array when no calculatedValues defined', () => {
    const json = { pages: [] }
    const result = evaluateMetrics(json, {})
    expect(result).toEqual([])
  })

  it('returns metrics using calculatedValues definitions', () => {
    const json = {
      pages: [],
      calculatedValues: [{ name: 'total_score', expression: '42' }],
    }
    modelState.calcValues = [{ name: 'total_score', value: 42 }]
    const result = evaluateMetrics(json, {})
    expect(result).toEqual([{ name: 'total_score', label: 'Total Score', value: 42 }])
  })

  it('uses title from definition when provided', () => {
    const json = {
      pages: [],
      calculatedValues: [{ name: 'bmi', title: 'Body Mass Index', expression: '24' }],
    }
    modelState.calcValues = [{ name: 'bmi', value: 24 }]
    const result = evaluateMetrics(json, {})
    expect(result[0].label).toBe('Body Mass Index')
  })

  it('falls back to answer value when cv map misses the name', () => {
    const json = {
      pages: [],
      calculatedValues: [{ name: 'stored_val', expression: '{q1}' }],
    }
    modelState.calcValues = [] // model returns nothing
    const result = evaluateMetrics(json, { stored_val: 99 })
    expect(result[0].value).toBe(99)
  })
})

describe('metricsFromStored()', () => {
  it('returns empty array when no calculatedValues defined', () => {
    const result = metricsFromStored({ pages: [] }, { total_score: 42 })
    expect(result).toEqual([])
  })

  it('maps stored metrics to MetricResult using calcDef order', () => {
    const json = {
      pages: [],
      calculatedValues: [
        { name: 'total_score', expression: '42' },
        { name: 'risk_level', expression: '"low"' },
      ],
    }
    const result = metricsFromStored(json, { total_score: 42, risk_level: 'low' })
    expect(result).toEqual([
      { name: 'total_score', label: 'Total Score', value: 42 },
      { name: 'risk_level', label: 'Risk Level', value: 'low' },
    ])
  })

  it('skips metrics not present in stored dict', () => {
    const json = {
      pages: [],
      calculatedValues: [
        { name: 'a', expression: '1' },
        { name: 'b', expression: '2' },
      ],
    }
    const result = metricsFromStored(json, { a: 10 })
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('a')
  })

  it('uses title from definition when provided', () => {
    const json = {
      pages: [],
      calculatedValues: [{ name: 'bmi', title: 'Body Mass Index', expression: '24' }],
    }
    const result = metricsFromStored(json, { bmi: 24.5 })
    expect(result[0].label).toBe('Body Mass Index')
    expect(result[0].value).toBe(24.5)
  })
})
