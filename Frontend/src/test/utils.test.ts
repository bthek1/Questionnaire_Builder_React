import { cn, buildShareUrl } from '@/lib/utils'

describe('cn()', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
  })

  it('deduplicates tailwind utilities (last wins)', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('handles undefined and null gracefully', () => {
    expect(cn('foo', undefined, null as unknown as string, 'bar')).toBe('foo bar')
  })

  it('returns empty string when no classes given', () => {
    expect(cn()).toBe('')
  })
})

describe('buildShareUrl()', () => {
  it('returns the take URL for a given id', () => {
    expect(buildShareUrl('abc-123')).toBe('http://localhost:3000/take/abc-123')
  })

  it('uses window.location.origin', () => {
    const originalOrigin = window.location.origin
    // jsdom default is http://localhost
    expect(buildShareUrl('xyz')).toBe(`${originalOrigin}/take/xyz`)
  })
})
