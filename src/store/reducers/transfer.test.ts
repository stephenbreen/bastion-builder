import { describe, it, expect } from 'vitest'
import { seedManor } from '../../data/seed'
import {
  SCHEMA_VERSION,
  buildExport,
  parseImport,
  parseImportJSON,
} from './transfer'

describe('buildExport', () => {
  it('wraps the bastion in a versioned envelope with timestamp', () => {
    const bastion = seedManor()
    const fakeNow = new Date('2026-05-06T12:00:00Z')
    const out = buildExport(bastion, fakeNow)
    expect(out.version).toBe(SCHEMA_VERSION)
    expect(out.exportedAt).toBe('2026-05-06T12:00:00.000Z')
    expect(out.bastion).toBe(bastion)
  })
})

describe('parseImport', () => {
  it('accepts an envelope produced by buildExport', () => {
    const envelope = buildExport(seedManor())
    const result = parseImport(envelope)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.bastion.name).toBe('The Manor on Old Hill')
      expect(result.sourceVersion).toBe(SCHEMA_VERSION)
    }
  })

  it('accepts a bare bastion (legacy / hand-edited)', () => {
    const result = parseImport(seedManor())
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.bastion.aspect).toBe('Bard')
  })

  it('rejects non-objects', () => {
    expect(parseImport(null).ok).toBe(false)
    expect(parseImport([]).ok).toBe(false)
    expect(parseImport('hello').ok).toBe(false)
    expect(parseImport(42).ok).toBe(false)
  })

  it('rejects when required fields are missing', () => {
    const incomplete = { ...seedManor() } as Partial<ReturnType<typeof seedManor>>
    delete incomplete.facilities
    const result = parseImport(incomplete)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/facilities/i)
  })

  it('rejects when a required field has the wrong type', () => {
    const broken = { ...seedManor(), treasury: 'lots' as unknown as number }
    const result = parseImport(broken)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/treasury/i)
  })

  it('rejects exports from a newer schema version', () => {
    const envelope = {
      version: SCHEMA_VERSION + 1,
      exportedAt: '2030-01-01T00:00:00Z',
      bastion: seedManor(),
    }
    const result = parseImport(envelope)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/newer schema/i)
  })

  it('migrates legacy top-level domainRenown into bastion.domain.renown', () => {
    const seed = seedManor()
    const legacy: Record<string, unknown> = { ...seed }
    delete legacy.domain
    legacy.domainRenown = 7
    legacy.lastIntrigueEndedWeek = 4
    const result = parseImport(legacy)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.bastion.domain.renown).toBe(7)
      expect(result.bastion.domain.lastIntrigueEndedWeek).toBe(4)
      expect(result.bastion.domain.size).toBe(1)
    }
  })

  it('defaults the domain object when missing entirely', () => {
    const seed = seedManor()
    const legacy: Record<string, unknown> = { ...seed }
    delete legacy.domain
    const result = parseImport(legacy)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.bastion.domain.renown).toBe(0)
      expect(result.bastion.domain.skills.lore).toBe(0)
    }
  })
})

describe('parseImportJSON', () => {
  it('roundtrips: bastion → JSON → parse equals the original', () => {
    const original = seedManor()
    const text = JSON.stringify(buildExport(original))
    const result = parseImportJSON(text)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.bastion).toEqual(original)
  })

  it('rejects malformed JSON with a useful reason', () => {
    const result = parseImportJSON('{ this is not json')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/invalid json/i)
  })
})
