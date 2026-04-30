import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuestionnaires } from '@/hooks/useQuestionnaires'
import { CopyButton } from '@/components/ui/CopyButton'
import { Button } from '@/components/ui/Button'

export const Route = createFileRoute('/questionnaires/share')({
  component: ShareLinksPage,
})

function ShareLinksPage() {
  const { data: questionnaires, isLoading } = useQuestionnaires()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild size="sm" variant="outline">
          <Link to="/questionnaires">← Back to list</Link>
        </Button>
        <h1 className="text-2xl font-semibold">Share Questionnaire Links</h1>
      </div>

      {!questionnaires || questionnaires.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-gray-500">
          <p>No questionnaires yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Respondent URL</th>
                <th className="px-4 py-3 text-right">Copy</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {questionnaires.map((q) => {
                const shareUrl = `${window.location.origin}/take/${q.id}`
                return (
                  <tr key={q.id} className="bg-white hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{q.title}</td>
                    <td className="px-4 py-3 text-gray-500">
                      <a
                        href={shareUrl}
                        className="font-mono text-xs text-blue-600 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {shareUrl}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <CopyButton id={q.id} label="Copy" />
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
