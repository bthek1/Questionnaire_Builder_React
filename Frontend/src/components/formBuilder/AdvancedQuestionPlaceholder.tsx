import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface AdvancedQuestionPlaceholderProps {
  name: string
  type: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onRawChange: (raw: Record<string, any>) => void
  onDelete: () => void
}

export function AdvancedQuestionPlaceholder({
  name,
  type,
  raw,
  onRawChange,
  onDelete,
}: AdvancedQuestionPlaceholderProps) {
  const [text, setText] = useState(() => JSON.stringify(raw, null, 2))
  const [parseError, setParseError] = useState<string | null>(null)

  function handleChange(value: string) {
    setText(value)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parsed = JSON.parse(value) as Record<string, any>
      setParseError(null)
      onRawChange(parsed)
    } catch {
      setParseError('Invalid JSON')
    }
  }

  return (
    <div
      data-testid="advanced-question-placeholder"
      className="flex flex-col gap-2 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-muted)] px-4 py-3 text-sm"
    >
      <div className="flex items-center justify-between">
        <div>
          <span className="font-medium">{name}</span>
          <span className="ml-2 text-[var(--color-muted-foreground)]">({type})</span>
        </div>
        <Button size="sm" variant="destructive" onClick={onDelete} aria-label={`Delete ${name}`}>
          Delete
        </Button>
      </div>
      <textarea
        className="w-full rounded border border-[var(--color-border)] bg-white px-2 py-1 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        rows={6}
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        aria-label="Raw question JSON"
        spellCheck={false}
      />
      {parseError && <p className="text-xs text-[var(--color-destructive)]">{parseError}</p>}
    </div>
  )
}
