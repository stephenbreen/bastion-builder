import type { Bastion, Follower, LogEntry } from '../../types'
import { newId } from '../../lib/id'

export interface FollowerInput {
  name: string
  source: Follower['source']
  role: Follower['role']
  bonus?: string
  assignment?: string
  notes?: string
}

function trim(value: string | undefined): string | undefined {
  if (value === undefined) return undefined
  const t = value.trim()
  return t === '' ? undefined : t
}

function buildFollower(input: FollowerInput): Follower {
  return {
    id: newId(),
    name: input.name.trim(),
    source: input.source,
    role: input.role,
    bonus: trim(input.bonus),
    assignment: trim(input.assignment),
    notes: trim(input.notes),
  }
}

function logEntry(week: number, outcome: string, payload?: Record<string, unknown>): LogEntry {
  return { id: newId(), week, type: 'system', outcome, payload }
}

export function addFollower(bastion: Bastion, input: FollowerInput): Bastion {
  if (!input.name.trim()) return bastion
  const follower = buildFollower(input)
  return {
    ...bastion,
    followers: [...bastion.followers, follower],
    log: [
      ...bastion.log,
      logEntry(bastion.inGameWeek, `Follower added: ${follower.name} (${follower.role}, ${follower.source}).`, {
        followerId: follower.id,
        source: follower.source,
        role: follower.role,
      }),
    ],
  }
}

export type FollowerPatch = Partial<Omit<FollowerInput, 'source'>> & {
  source?: Follower['source']
}

export function updateFollower(
  bastion: Bastion,
  id: string,
  patch: FollowerPatch,
): Bastion {
  const idx = bastion.followers.findIndex((f) => f.id === id)
  if (idx === -1) return bastion

  const current = bastion.followers[idx]
  const next: Follower = {
    ...current,
    name: patch.name !== undefined ? patch.name.trim() || current.name : current.name,
    source: patch.source ?? current.source,
    role: patch.role ?? current.role,
    bonus: patch.bonus !== undefined ? trim(patch.bonus) : current.bonus,
    assignment:
      patch.assignment !== undefined ? trim(patch.assignment) : current.assignment,
    notes: patch.notes !== undefined ? trim(patch.notes) : current.notes,
  }

  if (JSON.stringify(next) === JSON.stringify(current)) return bastion

  const followers = [...bastion.followers]
  followers[idx] = next

  return {
    ...bastion,
    followers,
    log: [
      ...bastion.log,
      logEntry(bastion.inGameWeek, `Follower updated: ${next.name}.`, {
        followerId: next.id,
      }),
    ],
  }
}

export function removeFollower(bastion: Bastion, id: string): Bastion {
  const target = bastion.followers.find((f) => f.id === id)
  if (!target) return bastion
  return {
    ...bastion,
    followers: bastion.followers.filter((f) => f.id !== id),
    log: [
      ...bastion.log,
      logEntry(bastion.inGameWeek, `Follower removed: ${target.name}.`, {
        followerId: target.id,
      }),
    ],
  }
}
