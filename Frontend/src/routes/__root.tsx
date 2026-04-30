import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

export const Route = createRootRoute({
  component: () => (
    <>
      <header className="sticky top-0 z-50 border-b bg-white">
        <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
          <Link to="/questionnaires" className="text-lg font-semibold tracking-tight">
            Questionnaire Builder
          </Link>
          <Link
            to="/questionnaires"
            className="text-sm text-gray-600 hover:text-gray-900 [&.active]:font-medium [&.active]:text-gray-900"
          >
            My Questionnaires
          </Link>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
      <TanStackRouterDevtools />
    </>
  ),
})
