import { useState } from 'react'
import type { Questionnaire } from '@/types'

interface Props {
  responses: Questionnaire[]
}

const TRUNCATE_LENGTH = 120

export function RawResponsesTable({ responses }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  function toggleRow(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="rounded-lg border">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium hover:bg-[var(--color-muted)]"
        onClick={() => setExpanded((v) => !v)}
      >
        <span>Raw Responses ({responses.length})</span>
        <span>{expanded ? '▲ Collapse' : '▼ Expand'}</span>
      </button>

      {expanded && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-muted)] text-left text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Submitted At</th>
                <th className="px-4 py-3">Answers (JSON preview)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {responses.map((r, index) => {
                const full = JSON.stringify(r.answers)
                const isLong = full.length > TRUNCATE_LENGTH
                const isRowExpanded = expandedRows.has(r.id)
                const preview =
                  isLong && !isRowExpanded ? full.slice(0, TRUNCATE_LENGTH) + '…' : full

                return (
                  <tr
                    key={r.id}
                    className="bg-[var(--color-card)] hover:bg-[var(--color-muted)] align-top"
                  >
                    <td className="px-4 py-3 text-[var(--color-muted-foreground)]">{index + 1}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-[var(--color-muted-foreground)]">
                      {new Date(r.submittedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--color-foreground)] max-w-md">
                      <span>{preview}</span>
                      {isLong && (
                        <button
                          type="button"
                          className="ml-2 text-blue-600 underline hover:no-underline"
                          onClick={() => toggleRow(r.id)}
                        >
                          {isRowExpanded ? 'View less' : 'View full'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
