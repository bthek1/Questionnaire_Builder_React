import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/Button'

export const Route = createFileRoute('/questionnaires/results')({
  component: ResultsPage,
})

function ResultsPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <p className="text-[var(--color-muted-foreground)] text-sm">This page has moved.</p>
      <Button asChild variant="outline">
        <Link to="/responses">All questionnaires</Link>
      </Button>
    </div>
  )
}
