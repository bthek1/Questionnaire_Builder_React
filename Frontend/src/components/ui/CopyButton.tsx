import * as React from 'react'
import { Button } from '@/components/ui/Button'
import { buildShareUrl } from '@/lib/utils'

interface Props {
  id: string
  label?: string
}

export function CopyButton({ id, label = 'Copy link' }: Props) {
  const [copied, setCopied] = React.useState(false)
  const [showFallback, setShowFallback] = React.useState(false)
  const url = buildShareUrl(id)

  function handleClick() {
    if (!navigator.clipboard) {
      setShowFallback(true)
      return
    }
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (showFallback) {
    return (
      <div className="flex items-center gap-1">
        <input
          readOnly
          value={url}
          className="h-8 rounded border px-2 text-xs"
          onFocus={(e) => e.currentTarget.select()}
        />
        <Button size="sm" variant="ghost" onClick={() => setShowFallback(false)}>
          ✕
        </Button>
      </div>
    )
  }

  return (
    <Button size="sm" variant="outline" onClick={handleClick}>
      {copied ? 'Copied!' : label}
    </Button>
  )
}
