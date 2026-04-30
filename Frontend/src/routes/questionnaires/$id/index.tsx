import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/questionnaires/$id/')({
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/questionnaires/$id/results', params })
  },
  component: () => null,
})
