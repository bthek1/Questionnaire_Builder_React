import * as React from 'react'
import { Button } from '@/components/ui/Button'
import { buildShareUrl } from '@/lib/utils'

interface Props {
  id: string
  label?: string
  shareUrl?: string
}

export function CopyButton({ id, label = 'Copy link', shareUrl }: Props) {
  const [copied, setCopied] = React.useState(false)
  const url = shareUrl ?? buildShareUrl(id)

  function handleClick() {
    const done = () => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(done).catch(fallback)
    } else {
      fallback()
    }

    function fallback() {
      const ta = document.createElement('textarea')
      ta.value = url
      ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      try {
        document.execCommand('copy')
        done()
      } finally {
        document.body.removeChild(ta)
      }
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={handleClick}>
      {copied ? 'Copied!' : label}
    </Button>
  )
}
