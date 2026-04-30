import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/questionnaires/$id/$responseId')({
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/questionnaires/$id/results', params: { id: params.id } })
  },
  component: () => null,
})
