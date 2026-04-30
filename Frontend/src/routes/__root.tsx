import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

export const Route = createRootRoute({
  component: () => (
    <>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-navbar)] shadow-sm">
          <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
            <Link
              to="/questionnaires"
              className="text-lg font-bold tracking-tight text-[var(--color-primary)] transition-colors"
            >
              Recovery Metrics
            </Link>
            <Link
              to="/questionnaires"
              className="text-sm text-[#5b6268] transition-colors hover:text-[#333333] [&.active]:font-medium [&.active]:text-[var(--color-primary)]"
            >
              Questionnaire Types
            </Link>
            <Link
              to="/responses"
              className="text-sm text-[#5b6268] transition-colors hover:text-[#333333] [&.active]:font-medium [&.active]:text-[var(--color-primary)]"
            >
              Questionnaires
            </Link>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          <Outlet />
        </main>
        <footer className="border-t border-[var(--color-border)] bg-[var(--color-footer)]">
          <div className="mx-auto flex h-[60px] max-w-5xl items-center justify-center px-4">
            <p className="text-sm text-[var(--color-footer-foreground)]">
              &copy; {new Date().getFullYear()} Recovery Metrics. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
      <TanStackRouterDevtools />
    </>
  ),
})
