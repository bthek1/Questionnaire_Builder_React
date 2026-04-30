import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { vi, beforeEach } from 'vitest'
import { CopyButton } from '@/components/ui/CopyButton'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CopyButton', () => {
  it('renders with default label', () => {
    render(<CopyButton id="abc" />)
    expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument()
  })

  it('renders with custom label', () => {
    render(<CopyButton id="abc" label="Share" />)
    expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument()
  })

  it('copies the correct URL to clipboard and shows Copied!', async () => {
    const writeText = vi.fn().mockResolvedValueOnce(undefined)
    Object.assign(navigator, { clipboard: { writeText } })

    render(<CopyButton id="abc-123" />)
    fireEvent.click(screen.getByRole('button', { name: /copy link/i }))

    await waitFor(() => expect(screen.getByRole('button', { name: /copied!/i })).toBeInTheDocument())
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('/take/abc-123'))
  })

  it('reverts to original label after 2 seconds', async () => {
    vi.useFakeTimers()
    const writeText = vi.fn().mockResolvedValueOnce(undefined)
    Object.assign(navigator, { clipboard: { writeText } })

    render(<CopyButton id="abc" label="Share" />)

    // Click and wait for the clipboard promise to resolve and update state
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /share/i }))
      await writeText.mock.results[0].value
    })

    expect(screen.getByRole('button', { name: /copied!/i })).toBeInTheDocument()

    act(() => { vi.advanceTimersByTime(2000) })
    expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('shows fallback input when clipboard API is unavailable', () => {
    // Remove clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    })

    render(<CopyButton id="no-clipboard" />)
    fireEvent.click(screen.getByRole('button', { name: /copy link/i }))

    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toContain('/take/no-clipboard')
  })

  it('hides fallback input when ✕ is clicked', () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    })

    render(<CopyButton id="no-clipboard" />)
    fireEvent.click(screen.getByRole('button', { name: /copy link/i }))
    fireEvent.click(screen.getByRole('button', { name: /✕/i }))

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument()
  })
})
