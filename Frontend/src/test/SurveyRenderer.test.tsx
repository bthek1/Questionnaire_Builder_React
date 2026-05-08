import { render } from '@testing-library/react'
import { vi, beforeEach } from 'vitest'

// --- Hoisted state for Model mock ---
const modelState = vi.hoisted(() => ({
  applyThemeArg: null as unknown,
  applyThemeCallCount: 0,
  onCompleteCallback: null as ((sender: { data: unknown }) => void) | null,
}))

vi.mock('survey-core', async () => {
  const actual = await vi.importActual<typeof import('survey-core')>('survey-core')
  return {
    ...actual,
    Model: class {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      constructor(_json: unknown) {}
      onComplete = {
        add: (cb: (sender: { data: unknown }) => void) => {
          modelState.onCompleteCallback = cb
        },
      }
      applyTheme(theme: unknown) {
        modelState.applyThemeArg = theme
        modelState.applyThemeCallCount++
      }
    },
  }
})

vi.mock('survey-react-ui', () => ({
  Survey: ({ model }: { model: unknown }) => (
    <div data-testid="survey-react-ui">{JSON.stringify(model)}</div>
  ),
}))

// Mock theme imports — each resolves to a simple object identifying itself
vi.mock('survey-core/themes', () => ({
  DefaultLight: { themeName: 'default-light' },
  FlatLight: { themeName: 'flat-light' },
  PlainLight: { themeName: 'plain-light' },
  SharpLight: { themeName: 'sharp-light' },
  BorderlessLight: { themeName: 'borderless-light' },
  SolidLight: { themeName: 'solid-light' },
  default: {},
}))

import {
  SurveyRenderer,
  SURVEY_THEMES,
  DEFAULT_THEME_KEY,
} from '@/components/survey/SurveyRenderer'

beforeEach(() => {
  modelState.applyThemeArg = null
  modelState.applyThemeCallCount = 0
  modelState.onCompleteCallback = null
})

describe('SurveyRenderer', () => {
  it('renders without crashing with a basic surveyJson', () => {
    const { getByTestId } = render(
      <SurveyRenderer surveyJson={{ pages: [] }} onComplete={vi.fn()} />,
    )
    expect(getByTestId('survey-react-ui')).toBeInTheDocument()
  })

  it('applies the Default theme by default', () => {
    render(<SurveyRenderer surveyJson={{ pages: [] }} onComplete={vi.fn()} />)
    expect(modelState.applyThemeCallCount).toBe(1)
    expect(modelState.applyThemeArg).toEqual(SURVEY_THEMES[DEFAULT_THEME_KEY])
  })

  it('applies the named theme when the theme prop is set', () => {
    render(<SurveyRenderer surveyJson={{ pages: [] }} onComplete={vi.fn()} theme="Flat" />)
    expect(modelState.applyThemeArg).toEqual(SURVEY_THEMES['Flat'])
  })

  it('falls back to Default theme for an unknown theme key', () => {
    render(<SurveyRenderer surveyJson={{ pages: [] }} onComplete={vi.fn()} theme="nonexistent" />)
    expect(modelState.applyThemeArg).toEqual(SURVEY_THEMES[DEFAULT_THEME_KEY])
  })

  it('applies themeJson from surveyJson when present, ignoring the theme prop', () => {
    const customTheme = { themeName: 'custom', colorPalette: 'light', cssVariables: {} }
    const surveyJson = { pages: [], themeJson: customTheme }
    render(<SurveyRenderer surveyJson={surveyJson} onComplete={vi.fn()} theme="Flat" />)
    expect(modelState.applyThemeArg).toEqual(customTheme)
  })

  it('does not use themeJson when surveyJson has no themeJson key', () => {
    render(<SurveyRenderer surveyJson={{ pages: [] }} onComplete={vi.fn()} theme="Sharp" />)
    expect(modelState.applyThemeArg).toEqual(SURVEY_THEMES['Sharp'])
  })

  it('exports SURVEY_THEMES with expected keys', () => {
    expect(Object.keys(SURVEY_THEMES)).toEqual(
      expect.arrayContaining(['Default', 'Flat', 'Plain', 'Sharp', 'Borderless', 'Solid']),
    )
  })
})
