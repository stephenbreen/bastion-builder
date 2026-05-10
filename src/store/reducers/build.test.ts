import { describe, it, expect } from 'vitest'
import { seedManor } from '../../data/seed'
import { startBuild } from './build'
import { advanceWeek } from './turn'
import { addCustomCatalogueEntry } from './homebrew-rooms'

const RICH = (n = 10_000) => ({ ...seedManor(), treasury: n })

describe('startBuild', () => {
  it('rejects unknown catalogue ids without changing the bastion', () => {
    const before = RICH()
    const result = startBuild(before, { catalogueId: 'not-real', size: 'roomy' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/unknown/i)
    expect(result.bastion).toBe(before)
  })

  it('rejects when treasury is insufficient', () => {
    const before = { ...seedManor(), treasury: 100 }
    const result = startBuild(before, { catalogueId: 'bedroom', size: 'cramped' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/treasury/i)
    expect(result.bastion.treasury).toBe(100)
    expect(result.bastion.facilities).toEqual(before.facilities)
  })

  it('appends a new under-construction facility with the right size + days', () => {
    const before = RICH()
    const result = startBuild(before, { catalogueId: 'bedroom', size: 'cramped' })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const added = result.bastion.facilities.find((f) => f.id === result.facilityId)
    expect(added).toBeDefined()
    expect(added?.name).toBe('Bedroom')
    expect(added?.size).toBe('cramped')
    expect(added?.state).toBe('under-construction')
    expect(added?.daysRemaining).toBe(20)
    expect(added?.cost).toBe(500)
    expect(added?.buildTimeDays).toBe(20)
    expect(added?.class).toBe('basic')
    expect(added?.orders).toEqual([])
  })

  it('deducts the cost from treasury', () => {
    const before = RICH(2000)
    const result = startBuild(before, { catalogueId: 'kitchen', size: 'roomy' })
    expect(result.ok).toBe(true)
    expect(result.bastion.treasury).toBe(1000)
  })

  it('logs a "construction started" entry tied to the new facility', () => {
    const before = RICH()
    const result = startBuild(before, { catalogueId: 'storage', size: 'vast' })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const log = result.bastion.log[result.bastion.log.length - 1]
    expect(log.type).toBe('construction')
    expect(log.actor).toBe(result.facilityId)
    expect(log.outcome).toMatch(/started.*Storage/i)
    expect(log.payload).toMatchObject({ size: 'vast', cost: 3000, days: 125 })
  })

  it('produces unique facility ids when the same entry is built twice', () => {
    const r1 = startBuild(RICH(), { catalogueId: 'bedroom', size: 'cramped' })
    const r2 = startBuild(RICH(), { catalogueId: 'bedroom', size: 'cramped' })
    if (!r1.ok || !r2.ok) throw new Error('expected both builds to succeed')
    expect(r1.facilityId).not.toBe(r2.facilityId)
  })

  it('builds homebrew entries with their cost overrides + orders + boosts', () => {
    const seed = RICH()
    const added = addCustomCatalogueEntry(seed, {
      name: 'Smithy of the Old Hill',
      class: 'special',
      category: 'production',
      sizes: ['roomy'],
      orders: ['Craft', 'Maintain'],
      domainSkillBoosts: [{ skill: 'operations', amount: 1 }],
      hirelingLabel: 'Master Smith',
      costOverride: { roomy: { cost: 1500, days: 60 } },
    })
    if (!added.ok) throw new Error('add failed')

    const result = startBuild(added.bastion, {
      catalogueId: added.entry.id,
      size: 'roomy',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const facility = result.bastion.facilities.find((f) => f.id === result.facilityId)
    expect(facility?.cost).toBe(1500)
    expect(facility?.buildTimeDays).toBe(60)
    expect(facility?.daysRemaining).toBe(60)
    expect(facility?.class).toBe('special')
    expect(facility?.orders).toEqual(['Craft', 'Maintain'])
    expect(facility?.domainSkillBoosts).toEqual([{ skill: 'operations', amount: 1 }])
    expect(result.bastion.treasury).toBe(seed.treasury - 1500)

    // Hireling autocreated and tied to the new facility.
    const hireling = result.bastion.hirelings.find((h) => h.facilityId === facility!.id)
    expect(hireling).toBeDefined()
    expect(hireling?.name).toBe('Master Smith')
    expect(facility?.hirelingId).toBe(hireling?.id)

    // Log payload tags it as homebrew.
    const log = result.bastion.log[result.bastion.log.length - 1]
    expect(log.payload).toMatchObject({ homebrew: true, cost: 1500, days: 60 })
  })

  it('falls back to SIZE_COSTS when an override is missing for the requested size', () => {
    const seed = RICH()
    const added = addCustomCatalogueEntry(seed, {
      name: 'Lecture Hall',
      class: 'basic',
      category: 'knowledge',
      sizes: ['cramped', 'roomy'],
      // only cramped is overridden — roomy should fall back to default 1000/45.
      costOverride: { cramped: { cost: 200, days: 10 } },
    })
    if (!added.ok) throw new Error('add failed')

    const result = startBuild(added.bastion, {
      catalogueId: added.entry.id,
      size: 'roomy',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const facility = result.bastion.facilities.find((f) => f.id === result.facilityId)
    expect(facility?.cost).toBe(1000)
    expect(facility?.buildTimeDays).toBe(45)
  })

  it('completes after the expected number of weeks', () => {
    let b = RICH()
    const r = startBuild(b, { catalogueId: 'bedroom', size: 'cramped' })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    b = r.bastion

    // Cramped = 20 days. After 1 week: 13d. After 2: 6d. After 3: complete.
    b = advanceWeek(b)
    expect(b.facilities.find((f) => f.id === r.facilityId)?.daysRemaining).toBe(13)
    b = advanceWeek(b)
    expect(b.facilities.find((f) => f.id === r.facilityId)?.daysRemaining).toBe(6)
    b = advanceWeek(b)
    const done = b.facilities.find((f) => f.id === r.facilityId)
    expect(done?.state).toBe('active')
    expect(done?.daysRemaining).toBeUndefined()

    const completion = b.log.find(
      (e) => e.type === 'construction' && e.actor === r.facilityId && /complete/i.test(e.outcome),
    )
    expect(completion).toBeDefined()
  })
})
