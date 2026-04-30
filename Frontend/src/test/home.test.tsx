import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { routeTree } from '../routeTree.gen'

function renderWithProviders() {
  const testQueryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const history = createMemoryHistory({ initialEntries: ['/'] })
  const router = createRouter({ routeTree, history })

  return render(
    <QueryClientProvider client={testQueryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('home route', () => {
  it('renders the heading', async () => {
    renderWithProviders()
    const link = await screen.findByRole('link', { name: /questionnaire builder/i })
    expect(link).toBeInTheDocument()
  })
})
