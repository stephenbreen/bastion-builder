import type {
  Bastion,
  LogEntry,
  Project,
  ProjectCategory,
  ProjectStatus,
  Ability,
  Edge,
  ProjectRollEvent,
} from '../../types'
import { newId } from '../../lib/id'
import { defaultRng, type Rng } from '../../lib/dice'

export interface ProjectInput {
  name: string
  category: ProjectCategory
  characteristic: Ability
  goal: number
  source?: string
  prerequisite?: string
  contributors?: string
}

function trim(value: string | undefined): string | undefined {
  if (value === undefined) return undefined
  const t = value.trim()
  return t === '' ? undefined : t
}

function logEntry(week: number, outcome: string, payload?: Record<string, unknown>): LogEntry {
  return { id: newId(), week, type: 'system', outcome, payload }
}

export function addProject(bastion: Bastion, input: ProjectInput): Bastion {
  const name = input.name.trim()
  if (!name) return bastion
  const goal = Math.max(1, Math.trunc(input.goal))
  if (!Number.isFinite(goal)) return bastion

  const project: Project = {
    id: newId(),
    name,
    category: input.category,
    characteristic: input.characteristic,
    goal,
    current: 0,
    source: trim(input.source),
    prerequisite: trim(input.prerequisite),
    contributors: trim(input.contributors),
    status: 'active',
    events: [],
  }

  return {
    ...bastion,
    projects: [...bastion.projects, project],
    log: [
      ...bastion.log,
      logEntry(
        bastion.inGameWeek,
        `Project started: ${project.name} (${project.category}, ${project.characteristic}, goal ${goal}).`,
        { projectId: project.id, category: project.category, goal },
      ),
    ],
  }
}

export type ProjectPatch = Partial<
  Omit<ProjectInput, 'goal'> & { goal: number; status: ProjectStatus; current: number }
>

export function updateProject(
  bastion: Bastion,
  id: string,
  patch: ProjectPatch,
): Bastion {
  const idx = bastion.projects.findIndex((p) => p.id === id)
  if (idx === -1) return bastion
  const current = bastion.projects[idx]

  const next: Project = {
    ...current,
    name: patch.name !== undefined ? patch.name.trim() || current.name : current.name,
    category: patch.category ?? current.category,
    characteristic: patch.characteristic ?? current.characteristic,
    goal:
      patch.goal !== undefined && Number.isFinite(patch.goal)
        ? Math.max(1, Math.trunc(patch.goal))
        : current.goal,
    current:
      patch.current !== undefined && Number.isFinite(patch.current)
        ? Math.max(0, Math.trunc(patch.current))
        : current.current,
    source: patch.source !== undefined ? trim(patch.source) : current.source,
    prerequisite:
      patch.prerequisite !== undefined ? trim(patch.prerequisite) : current.prerequisite,
    contributors:
      patch.contributors !== undefined ? trim(patch.contributors) : current.contributors,
    status: patch.status ?? current.status,
  }

  if (JSON.stringify({ ...next, events: 0 }) === JSON.stringify({ ...current, events: 0 })) {
    return bastion
  }

  const projects = [...bastion.projects]
  projects[idx] = next

  return {
    ...bastion,
    projects,
    log: [
      ...bastion.log,
      logEntry(
        bastion.inGameWeek,
        next.status !== current.status
          ? `Project ${next.name}: ${current.status} → ${next.status}.`
          : `Project updated: ${next.name}.`,
        { projectId: next.id },
      ),
    ],
  }
}

export function removeProject(bastion: Bastion, id: string): Bastion {
  const target = bastion.projects.find((p) => p.id === id)
  if (!target) return bastion
  return {
    ...bastion,
    projects: bastion.projects.filter((p) => p.id !== id),
    log: [
      ...bastion.log,
      logEntry(bastion.inGameWeek, `Project removed: ${target.name}.`, {
        projectId: target.id,
      }),
    ],
  }
}

export interface RollProjectInput {
  modifier: number
  edge?: Edge
  rollerNote?: string
}

export type RollProjectResult =
  | {
      ok: true
      bastion: Bastion
      event: ProjectRollEvent
      completed: boolean
    }
  | { ok: false; bastion: Bastion; reason: string }

function rollD20(rng: Rng): number {
  return Math.floor(rng() * 20) + 1
}

export function rollProject(
  bastion: Bastion,
  projectId: string,
  input: RollProjectInput,
  rng: Rng = defaultRng,
): RollProjectResult {
  const project = bastion.projects.find((p) => p.id === projectId)
  if (!project) {
    return { ok: false, bastion, reason: 'Unknown project.' }
  }
  if (project.status !== 'active') {
    return {
      ok: false,
      bastion,
      reason: `Project is ${project.status}; resume it before rolling.`,
    }
  }

  const modifier = Math.trunc(input.modifier)
  if (!Number.isFinite(modifier)) {
    return { ok: false, bastion, reason: 'Modifier must be a finite number.' }
  }
  const edge: Edge = input.edge ?? 0
  const d20 = rollD20(rng)
  const pointsAdded = Math.max(1, d20 + modifier + edge)
  const breakthrough = d20 === 20

  const event: ProjectRollEvent = {
    id: newId(),
    week: bastion.inGameWeek,
    d20,
    modifier,
    edge,
    pointsAdded,
    breakthrough,
    rollerNote: trim(input.rollerNote),
  }

  const newCurrent = project.current + pointsAdded
  const completed = newCurrent >= project.goal
  const updated: Project = {
    ...project,
    current: newCurrent,
    events: [...project.events, event],
    status: completed ? 'complete' : project.status,
  }

  const sign = (n: number) => (n >= 0 ? `+${n}` : `${n}`)
  const log: LogEntry = {
    id: newId(),
    week: bastion.inGameWeek,
    actor: project.id,
    type: 'project-roll',
    outcome:
      `${project.name}: rolled ${d20}${sign(modifier)}` +
      (edge !== 0 ? ` ${sign(edge)} edge` : '') +
      ` = ${pointsAdded} pts (${newCurrent}/${project.goal})` +
      (breakthrough ? ' — BREAKTHROUGH (free roll this week)' : '') +
      (completed ? '. Project complete.' : '.'),
    payload: {
      projectId: project.id,
      d20,
      modifier,
      edge,
      pointsAdded,
      breakthrough,
      newCurrent,
      goal: project.goal,
      completed,
      rollerNote: event.rollerNote,
    },
  }

  return {
    ok: true,
    completed,
    event,
    bastion: {
      ...bastion,
      projects: bastion.projects.map((p) => (p.id === projectId ? updated : p)),
      log: [...bastion.log, log],
    },
  }
}
