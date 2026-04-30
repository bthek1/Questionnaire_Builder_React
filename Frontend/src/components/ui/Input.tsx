import * as React from 'react'
import { cn } from '@/lib/utils'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-9 w-full rounded border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-[var(--color-muted-foreground)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = 'Input'

export { Input }
