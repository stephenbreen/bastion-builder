import { describe, it, expect } from 'vitest'
import { tileSpanClasses } from './grid'

describe('tileSpanClasses', () => {
  it('cramped occupies a single cell', () => {
    expect(tileSpanClasses('cramped')).toBe('col-span-1 row-span-1')
  })
  it('roomy spans two columns', () => {
    expect(tileSpanClasses('roomy')).toBe('col-span-2 row-span-1')
  })
  it('vast spans two columns and two rows', () => {
    expect(tileSpanClasses('vast')).toBe('col-span-2 row-span-2')
  })
})
