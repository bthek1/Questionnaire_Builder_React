import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RawResponsesTable } from '@/components/questionnaire/RawResponsesTable'
import type { QuestionnaireResponse } from '@/types'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

const responses: QuestionnaireResponse[] = [
  {
    id: 'r1',
    questionnaireTypeId: 'q1',
    answers: [{ questionId: 'q1', value: 'Yes' }],
    submittedAt: '2026-04-30T14:22:00Z',
  },
  {
    id: 'r2',
    questionnaireTypeId: 'q1',
    answers: [{ questionId: 'q1', value: 'No' }],
    submittedAt: '2026-04-29T09:01:00Z',
  },
]

const longAnswers = Array.from({ length: 10 }, (_, i) => ({
  questionId: `q${i}`,
  value: `answer-${i}`,
}))
const longResponse: QuestionnaireResponse = {
  id: 'r3',
  questionnaireTypeId: 'q1',
  answers: longAnswers,
  submittedAt: '2026-04-28T10:00:00Z',
}

function expandTable() {
  const toggle = screen.getByRole('button', { name: /raw responses/i })
  fireEvent.click(toggle)
}

describe('RawResponsesTable', () => {
  it('renders correct row count after expanding', () => {
    render(<RawResponsesTable responses={responses} />, { wrapper })
    expandTable()
    const rows = screen.getAllByRole('row')
    // 1 header row + 2 data rows
    expect(rows).toHaveLength(3)
  })

  it('truncates long JSON strings in the answers column', () => {
    render(<RawResponsesTable responses={[longResponse]} />, { wrapper })
    expandTable()
    expect(screen.getByText(/…/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /view full/i })).toBeInTheDocument()
  })

  it('"View full" toggle shows complete JSON', () => {
    render(<RawResponsesTable responses={[longResponse]} />, { wrapper })
    expandTable()
    const viewFull = screen.getByRole('button', { name: /view full/i })
    fireEvent.click(viewFull)
    expect(screen.queryByText(/…/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /view less/i })).toBeInTheDocument()
  })
})
