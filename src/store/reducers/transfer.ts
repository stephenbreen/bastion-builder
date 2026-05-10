import type { Bastion, Domain } from '../../types'
import { emptyDomain } from '../../types'

// Bumped together with the persisted bastion schema (server-side once the
// cloud-state migration lands; was the persist version in useBastionStore
// prior to Phase B).
export const SCHEMA_VERSION = 10

export interface ExportFile {
  version: number
  exportedAt: string
  bastion: Bastion
}

export function buildExport(bastion: Bastion, now: Date = new Date()): ExportFile {
  return {
    version: SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    bastion,
  }
}

export type ParseResult =
  | { ok: true; bastion: Bastion; sourceVersion: number }
  | { ok: false; reason: string }

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function validateBastion(input: unknown): ParseResult {
  if (!isObject(input)) {
    return { ok: false, reason: 'Bastion data is not an object.' }
  }

  const required: [string, 'string' | 'number' | 'array'][] = [
    ['name', 'string'],
    ['aspect', 'string'],
    ['strongholdLevel', 'number'],
    ['treasury', 'number'],
    ['inGameWeek', 'number'],
    ['facilities', 'array'],
    ['hirelings', 'array'],
    ['log', 'array'],
  ]

  for (const [key, kind] of required) {
    const value = input[key]
    if (value === undefined) {
      return { ok: false, reason: `Missing required field: ${key}.` }
    }
    if (kind === 'array' ? !Array.isArray(value) : typeof value !== kind) {
      return { ok: false, reason: `Field ${key} has the wrong type (expected ${kind}).` }
    }
  }

  // Fill in fields added in later schema bumps so older exports still load.
  const incoming = input as Record<string, unknown>
  const baseDomain: Domain = isDomain(incoming.domain) ? incoming.domain : emptyDomain()
  // Migrate v≤6 top-level fields into the new domain object.
  const migratedDomain: Domain = {
    ...baseDomain,
    renown:
      isDomain(incoming.domain) && typeof incoming.domain.renown === 'number'
        ? incoming.domain.renown
        : typeof incoming.domainRenown === 'number'
          ? incoming.domainRenown
          : baseDomain.renown,
    lastIntrigueEndedWeek:
      isDomain(incoming.domain) && typeof incoming.domain.lastIntrigueEndedWeek === 'number'
        ? incoming.domain.lastIntrigueEndedWeek
        : typeof incoming.lastIntrigueEndedWeek === 'number'
          ? incoming.lastIntrigueEndedWeek
          : baseDomain.lastIntrigueEndedWeek,
  }

  const bastion: Bastion = {
    ...(input as unknown as Bastion),
    domain: migratedDomain,
    followers: Array.isArray(incoming.followers) ? (incoming.followers as Bastion['followers']) : [],
    projects: Array.isArray(incoming.projects) ? (incoming.projects as Bastion['projects']) : [],
  }

  return { ok: true, bastion, sourceVersion: SCHEMA_VERSION }
}

function isDomain(value: unknown): value is Domain {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.size === 'number' &&
    typeof v.renown === 'number' &&
    typeof v.intrigueActive === 'boolean' &&
    typeof v.intrigueTurnsRemaining === 'number' &&
    typeof v.skills === 'object' &&
    typeof v.defenses === 'object'
  )
}

export function parseImport(input: unknown): ParseResult {
  if (!isObject(input)) {
    return { ok: false, reason: 'Import file is not a JSON object.' }
  }

  // Two accepted shapes: { version, exportedAt, bastion } envelope (what we
  // produce) or a bare Bastion (someone hand-edited or pulled from devtools).
  const looksLikeEnvelope = 'bastion' in input && 'version' in input

  if (looksLikeEnvelope) {
    const version = input.version
    if (typeof version !== 'number') {
      return { ok: false, reason: 'Envelope version must be a number.' }
    }
    if (version > SCHEMA_VERSION) {
      return {
        ok: false,
        reason: `Export is from a newer schema (v${version}); this app supports v${SCHEMA_VERSION}.`,
      }
    }
    const result = validateBastion(input.bastion)
    if (!result.ok) return result
    return { ok: true, bastion: result.bastion, sourceVersion: version }
  }

  return validateBastion(input)
}

export function parseImportJSON(text: string): ParseResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (e) {
    return { ok: false, reason: `Invalid JSON: ${(e as Error).message}` }
  }
  return parseImport(parsed)
}
