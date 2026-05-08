/* eslint-disable react-refresh/only-export-components */
import { createFileRoute, Link } from '@tanstack/react-router'
import { useBattery } from '@/hooks/useBatteries'
import { Button } from '@/components/ui/Button'
import { CopyButton } from '@/components/ui/CopyButton'

export const Route = createFileRoute('/batteries/$id')({
  component: BatteryDetailPage,
})

function BatteryDetailPage() {
  const { id } = Route.useParams()
  const { data: battery, isLoading } = useBattery(id)

  if (isLoading) {
    return <div className="h-32 animate-pulse rounded-lg bg-[var(--color-muted)]" />
  }

  if (!battery) {
    return <p className="text-[var(--color-muted-foreground)]">Battery not found.</p>
  }

  const shareUrl = `${window.location.origin}/take-battery/${battery.shareToken}`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{battery.name || battery.batteryTypeName}</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Type: {battery.batteryTypeName}
          </p>
        </div>
        <span
          className={`rounded px-3 py-1 text-sm font-medium ${
            battery.isComplete ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {battery.isComplete ? 'Complete' : 'Pending'}
        </span>
      </div>

      <div className="flex items-center gap-2 rounded-lg border p-4">
        <span className="flex-1 truncate text-sm font-mono text-[var(--color-muted-foreground)]">
          {shareUrl}
        </span>
        <CopyButton id={battery.shareToken} label="Copy Link" shareUrl={shareUrl} />
      </div>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-muted)] text-left text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Survey</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3 text-right">Results</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {battery.questionnaires.map((slot) => (
              <tr key={slot.questionnaireId} className="bg-[var(--color-card)]">
                <td className="px-4 py-3 text-[var(--color-muted-foreground)]">{slot.order + 1}</td>
                <td className="px-4 py-3 font-medium">{slot.questionnaireTypeName}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      slot.submittedAt
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {slot.submittedAt ? 'Submitted' : 'Pending'}
                  </span>
                </td>
                <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                  {slot.submittedAt ? new Date(slot.submittedAt).toLocaleString() : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  {slot.submittedAt && (
                    <Button asChild size="sm" variant="outline">
                      <Link to="/questionnaires/$id/results" params={{ id: slot.questionnaireId }}>
                        Results
                      </Link>
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
