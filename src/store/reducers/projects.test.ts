import { describe, it, expect } from 'vitest'
import { seedManor } from '../../data/seed'
import {
  addProject,
  removeProject,
  rollProject,
  updateProject,
  type ProjectInput,
} from './projects'

const draft = (overrides: Partial<ProjectInput> = {}): ProjectInput => ({
  name: 'Decipher the manor ledger',
  category: 'research',
  characteristic: 'INT',
  goal: 45,
  ...overrides,
})

// Stub RNG mapped to specific d20 outputs.
const rngFor = (...rolls: number[]) => {
  let i = 0
  return () => {
    const roll = rolls[i++ % rolls.length]
    return (roll - 1) / 20 + 1e-9
  }
}

describe('addProject', () => {
  it('appends a project with current=0 and active status', () => {
    const after = addProject(seedManor(), draft())
    expect(after.projects).toHaveLength(1)
    const p = after.projects[0]
    expect(p.current).toBe(0)
    expect(p.status).toBe('active')
    expect(p.events).toEqual([])
    expect(p.goal).toBe(45)
  })

  it('rejects empty names', () => {
    const before = seedManor()
    const after = addProject(before, draft({ name: '   ' }))
    expect(after).toBe(before)
  })

  it('floors goal at 1', () => {
    const after = addProject(seedManor(), draft({ goal: 0 }))
    expect(after.projects[0].goal).toBe(1)
  })
})

describe('updateProject', () => {
  it('merges patch and logs', () => {
    const seeded = addProject(seedManor(), draft())
    const id = seeded.projects[0].id
    const after = updateProject(seeded, id, { goal: 100, status: 'paused' })
    expect(after.projects[0].goal).toBe(100)
    expect(after.projects[0].status).toBe('paused')
    const last = after.log[after.log.length - 1]
    expect(last.outcome).toMatch(/active.*paused/)
  })

  it('is a no-op for unknown id', () => {
    const before = addProject(seedManor(), draft())
    expect(updateProject(before, 'nope', { goal: 99 })).toBe(before)
  })
})

describe('removeProject', () => {
  it('drops the project + logs', () => {
    const seeded = addProject(seedManor(), draft())
    const id = seeded.projects[0].id
    const after = removeProject(seeded, id)
    expect(after.projects).toHaveLength(0)
    expect(after.log[after.log.length - 1].outcome).toMatch(/removed.*ledger/i)
  })
  it('no-ops for unknown id', () => {
    const before = addProject(seedManor(), draft())
    expect(removeProject(before, 'nope')).toBe(before)
  })
})

describe('rollProject', () => {
  it('rejects unknown project id', () => {
    const result = rollProject(seedManor(), 'no-such-id', { modifier: 0 })
    expect(result.ok).toBe(false)
  })

  it('rejects when project is paused', () => {
    let b = addProject(seedManor(), draft())
    const id = b.projects[0].id
    b = updateProject(b, id, { status: 'paused' })
    const result = rollProject(b, id, { modifier: 3 })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/paused/i)
  })

  it('adds (d20 + mod + edge) min 1 and accumulates current', () => {
    const seeded = addProject(seedManor(), draft())
    const id = seeded.projects[0].id

    const result = rollProject(seeded, id, { modifier: 4, edge: 2 }, rngFor(10))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    // 10 + 4 + 2 = 16
    expect(result.event.pointsAdded).toBe(16)
    expect(result.bastion.projects[0].current).toBe(16)
    expect(result.event.breakthrough).toBe(false)
    expect(result.completed).toBe(false)
  })

  it('clamps to a minimum of 1 point on a bad roll', () => {
    const seeded = addProject(seedManor(), draft())
    const id = seeded.projects[0].id

    const result = rollProject(seeded, id, { modifier: -10, edge: -2 }, rngFor(1))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    // 1 - 10 - 2 = -11 → clamped to 1
    expect(result.event.pointsAdded).toBe(1)
    expect(result.event.d20).toBe(1)
  })

  it('flags nat-20 as breakthrough but does not double points', () => {
    const seeded = addProject(seedManor(), draft())
    const id = seeded.projects[0].id

    const result = rollProject(seeded, id, { modifier: 5 }, rngFor(20))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.event.d20).toBe(20)
    expect(result.event.pointsAdded).toBe(25)
    expect(result.event.breakthrough).toBe(true)
  })

  it('auto-completes when current ≥ goal and logs project complete', () => {
    let b = addProject(seedManor(), draft({ goal: 15 }))
    const id = b.projects[0].id

    const result = rollProject(b, id, { modifier: 2 }, rngFor(15)) // adds 17
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.completed).toBe(true)
    expect(result.bastion.projects[0].status).toBe('complete')

    const log = result.bastion.log[result.bastion.log.length - 1]
    expect(log.type).toBe('project-roll')
    expect(log.outcome).toMatch(/Project complete/)
  })

  it('records the event on the project for replay', () => {
    let b = addProject(seedManor(), draft())
    const id = b.projects[0].id
    const r1 = rollProject(b, id, { modifier: 3 }, rngFor(7))
    expect(r1.ok).toBe(true)
    if (!r1.ok) return
    const r2 = rollProject(r1.bastion, id, { modifier: 3 }, rngFor(11))
    expect(r2.ok).toBe(true)
    if (!r2.ok) return

    expect(r2.bastion.projects[0].events).toHaveLength(2)
    expect(r2.bastion.projects[0].events.map((e) => e.d20)).toEqual([7, 11])
  })
})
