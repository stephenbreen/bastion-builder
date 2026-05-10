import { describe, it, expect } from 'vitest'
import { seedManor } from '../../data/seed'
import { addFollower, removeFollower, updateFollower } from './followers'

const draft = (overrides: Partial<Parameters<typeof addFollower>[1]> = {}) => ({
  name: 'Mira',
  source: 'renown' as const,
  role: 'Project Helper' as const,
  ...overrides,
})

describe('addFollower', () => {
  it('appends a follower with a generated id and trimmed name', () => {
    const before = seedManor()
    const after = addFollower(before, draft({ name: '  Mira  ' }))
    expect(after.followers).toHaveLength(1)
    const f = after.followers[0]
    expect(f.id).toBeTruthy()
    expect(f.name).toBe('Mira')
    expect(f.role).toBe('Project Helper')
    expect(f.source).toBe('renown')
  })

  it('drops empty optional fields rather than storing empty strings', () => {
    const after = addFollower(seedManor(), draft({ bonus: '   ', notes: '' }))
    const f = after.followers[0]
    expect(f.bonus).toBeUndefined()
    expect(f.notes).toBeUndefined()
  })

  it('logs a system entry on add', () => {
    const after = addFollower(seedManor(), draft())
    const last = after.log[after.log.length - 1]
    expect(last.type).toBe('system')
    expect(last.outcome).toMatch(/Mira.*Project Helper.*renown/i)
  })

  it('rejects empty names without changing the bastion', () => {
    const before = seedManor()
    const after = addFollower(before, draft({ name: '   ' }))
    expect(after).toBe(before)
  })
})

describe('updateFollower', () => {
  it('merges a patch into the matching follower', () => {
    const seeded = addFollower(seedManor(), draft())
    const id = seeded.followers[0].id
    const after = updateFollower(seeded, id, { role: 'Ambassador', bonus: '+1 to diplomacy rolls' })
    expect(after.followers[0].role).toBe('Ambassador')
    expect(after.followers[0].bonus).toBe('+1 to diplomacy rolls')
  })

  it('is a no-op for an unknown id', () => {
    const before = addFollower(seedManor(), draft())
    const after = updateFollower(before, 'no-such-follower', { role: 'Unit' })
    expect(after).toBe(before)
  })

  it('is a no-op when the patch results in identical state', () => {
    const before = addFollower(seedManor(), draft())
    const id = before.followers[0].id
    const after = updateFollower(before, id, { role: 'Project Helper' })
    expect(after).toBe(before)
  })
})

describe('removeFollower', () => {
  it('drops the follower by id', () => {
    const seeded = addFollower(seedManor(), draft())
    const id = seeded.followers[0].id
    const after = removeFollower(seeded, id)
    expect(after.followers).toHaveLength(0)
  })

  it('is a no-op for an unknown id', () => {
    const before = addFollower(seedManor(), draft())
    const after = removeFollower(before, 'no-such-id')
    expect(after).toBe(before)
  })
})
