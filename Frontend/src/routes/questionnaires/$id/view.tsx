import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/questionnaires/$id/view')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/questionnaires/$id/view"!</div>
}
