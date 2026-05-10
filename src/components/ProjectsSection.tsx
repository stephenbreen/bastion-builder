import { useState, type FormEvent } from 'react'
import {
  ABILITIES,
  PROJECT_CATEGORIES,
  type Ability,
  type Project,
  type ProjectCategory,
  type ProjectStatus,
  type Edge,
} from '../types'
import { useBastionStore } from '../store/useBastionStore'
import { usePlayerView } from '../lib/view-mode'

interface DraftState {
  name: string
  category: ProjectCategory
  characteristic: Ability
  goal: number
  source: string
  prerequisite: string
  contributors: string
}

const emptyDraft: DraftState = {
  name: '',
  category: 'research',
  characteristic: 'INT',
  goal: 45,
  source: '',
  prerequisite: '',
  contributors: '',
}

const categoryTone: Record<ProjectCategory, string> = {
  crafting: 'bg-bastion-ember text-bastion-parchment',
  research: 'bg-bastion-azure text-bastion-parchment',
  skill: 'bg-bastion-verdant text-bastion-parchment',
  community: 'bg-bastion-gold text-bastion-oak-deep',
  special: 'bg-bastion-crimson text-bastion-parchment',
}

const statusTone: Record<ProjectStatus, string> = {
  active: 'border-bastion-verdant text-bastion-verdant bg-bastion-verdant/10',
  paused: 'border-bastion-ember text-bastion-ember bg-bastion-ember/10',
  complete: 'border-bastion-gold-deep text-bastion-gold-deep bg-bastion-gold/20',
  abandoned: 'border-bastion-crimson text-bastion-crimson bg-bastion-crimson/10',
}

interface ProjectFormProps {
  initial?: DraftState
  submitLabel: string
  onSubmit: (draft: DraftState) => void
  onCancel: () => void
}

function ProjectForm({ initial, submitLabel, onSubmit, onCancel }: ProjectFormProps) {
  const [draft, setDraft] = useState<DraftState>(initial ?? emptyDraft)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!draft.name.trim() || draft.goal < 1) return
    onSubmit(draft)
  }

  const update = <K extends keyof DraftState>(key: K, value: DraftState[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  return (
    <form
      onSubmit={handleSubmit}
      className="parchment-surface rounded-md border-2 border-bastion-oak p-3 space-y-2 shadow-[1px_2px_0_rgba(0,0,0,0.4)]"
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <input
          autoFocus
          value={draft.name}
          onChange={(e) => update('name', e.target.value)}
          placeholder="Project name"
          aria-label="Project name"
          required
          className="rounded border border-bastion-oak bg-bastion-parchment-warm px-2 py-1 text-lg text-bastion-ink placeholder:text-bastion-ink-mute focus:outline-none focus:ring-2 focus:ring-bastion-crimson md:col-span-2"
        />
        <select
          value={draft.category}
          onChange={(e) => update('category', e.target.value as ProjectCategory)}
          aria-label="Category"
          className="rounded border border-bastion-oak bg-bastion-parchment-warm px-2 py-1 text-lg text-bastion-ink focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
        >
          {PROJECT_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          value={draft.characteristic}
          onChange={(e) => update('characteristic', e.target.value as Ability)}
          aria-label="Characteristic"
          className="rounded border border-bastion-oak bg-bastion-parchment-warm px-2 py-1 text-lg text-bastion-ink focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
        >
          {ABILITIES.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <label className="flex items-center gap-2 text-base text-bastion-ink-soft">
          <span className="uppercase tracking-wider">Goal pts</span>
          <input
            type="number"
            min={1}
            step={1}
            value={draft.goal}
            onChange={(e) => update('goal', Math.max(1, Number(e.target.value)))}
            aria-label="Goal points"
            className="w-24 rounded border border-bastion-oak bg-bastion-parchment-warm px-2 py-1 text-lg text-bastion-ink focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
          />
        </label>
        <input
          value={draft.source}
          onChange={(e) => update('source', e.target.value)}
          placeholder="Source (Library, NPC mentor…)"
          aria-label="Source"
          className="rounded border border-bastion-oak bg-bastion-parchment-warm px-2 py-1 text-lg text-bastion-ink placeholder:text-bastion-ink-mute focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
        />
        <input
          value={draft.prerequisite}
          onChange={(e) => update('prerequisite', e.target.value)}
          placeholder="Prerequisite (item / resource)"
          aria-label="Prerequisite"
          className="rounded border border-bastion-oak bg-bastion-parchment-warm px-2 py-1 text-lg text-bastion-ink placeholder:text-bastion-ink-mute focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
        />
      </div>
      <input
        value={draft.contributors}
        onChange={(e) => update('contributors', e.target.value)}
        placeholder="Contributors (free-form: Mira, Astrid, Lib hireling)"
        aria-label="Contributors"
        className="w-full rounded border border-bastion-oak bg-bastion-parchment-warm px-2 py-1 text-lg text-bastion-ink placeholder:text-bastion-ink-mute focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
      />
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-bastion-oak px-3 py-1 text-base uppercase tracking-wider text-bastion-ink-soft hover:text-bastion-ink hover:bg-bastion-parchment-warm transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!draft.name.trim() || draft.goal < 1}
          className="banner-ribbon rounded px-3 py-1 text-base font-display tracking-[0.08em] uppercase hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  )
}

interface RollFormProps {
  project: Project
  onCancel: () => void
}

function RollForm({ project, onCancel }: RollFormProps) {
  const rollProject = useBastionStore((s) => s.rollProject)
  const [modifier, setModifier] = useState(3)
  const [edge, setEdge] = useState<Edge>(0)
  const [rollerNote, setRollerNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<{
    d20: number
    pointsAdded: number
    breakthrough: boolean
    completed: boolean
  } | null>(null)

  const handleRoll = (e: FormEvent) => {
    e.preventDefault()
    const result = rollProject(project.id, { modifier, edge, rollerNote })
    if (result.ok) {
      setLastResult({
        d20: result.event.d20,
        pointsAdded: result.event.pointsAdded,
        breakthrough: result.event.breakthrough,
        completed: result.completed,
      })
      setError(null)
    } else {
      setError(result.reason)
    }
  }

  return (
    <form
      onSubmit={handleRoll}
      className="rounded border-2 border-bastion-crimson bg-bastion-crimson/5 p-2 space-y-2"
    >
      <div className="flex items-center gap-2 flex-wrap text-base text-bastion-ink">
        <span className="uppercase tracking-wider text-bastion-oak">d20 +</span>
        <input
          type="number"
          step={1}
          value={modifier}
          onChange={(e) => setModifier(Math.trunc(Number(e.target.value)))}
          aria-label={`Modifier for ${project.name}`}
          className="w-16 rounded border border-bastion-oak bg-bastion-parchment-warm px-2 py-1 text-lg text-bastion-ink focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
        />
        <span className="text-bastion-ink-mute">({project.characteristic})</span>
        <select
          value={edge}
          onChange={(e) => setEdge(Number(e.target.value) as Edge)}
          aria-label={`Edge for ${project.name}`}
          className="rounded border border-bastion-oak bg-bastion-parchment-warm px-2 py-1 text-lg text-bastion-ink focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
        >
          <option value={0}>no edge</option>
          <option value={2}>edge (+2)</option>
          <option value={-2}>bane (−2)</option>
        </select>
      </div>
      <input
        value={rollerNote}
        onChange={(e) => setRollerNote(e.target.value)}
        placeholder="Roller (e.g. Astrid)"
        aria-label={`Roller for ${project.name}`}
        className="w-full rounded border border-bastion-oak bg-bastion-parchment-warm px-2 py-1 text-base text-bastion-ink placeholder:text-bastion-ink-mute focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
      />
      {lastResult && (
        <div className="rounded bg-bastion-parchment-warm/60 px-2 py-1 text-base text-bastion-ink">
          <span className="font-bold">d20 = {lastResult.d20}</span>
          <span> · +{lastResult.pointsAdded} pts</span>
          {lastResult.breakthrough && (
            <span className="ml-2 text-bastion-crimson font-semibold">
              BREAKTHROUGH — free roll this week
            </span>
          )}
          {lastResult.completed && (
            <span className="ml-2 text-bastion-gold-deep font-semibold">PROJECT COMPLETE</span>
          )}
        </div>
      )}
      {error && (
        <div className="rounded bg-bastion-crimson/10 px-2 py-1 text-base text-bastion-crimson" role="alert">
          {error}
        </div>
      )}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-bastion-oak px-2 py-1 text-base uppercase tracking-wider text-bastion-ink-soft hover:text-bastion-ink transition-colors"
        >
          Close
        </button>
        <button
          type="submit"
          className="banner-ribbon rounded px-3 py-1 text-base font-display tracking-[0.08em] uppercase hover:brightness-110 transition-all"
        >
          Roll
        </button>
      </div>
    </form>
  )
}

interface ProjectCardProps {
  project: Project
  onEdit: () => void
  onRemove: () => void
}

function ProjectCard({ project, onEdit, onRemove }: ProjectCardProps) {
  const updateProject = useBastionStore((s) => s.updateProject)
  const isPlayer = usePlayerView()
  const [rolling, setRolling] = useState(false)

  const pct = Math.min(100, Math.round((project.current / project.goal) * 100))
  const recent = project.events.slice(-3).reverse()
  const isActive = project.status === 'active'

  const setStatus = (status: Project['status']) => updateProject(project.id, { status })

  return (
    <div className="parchment-surface rounded-md border-[3px] border-bastion-oak p-3 shadow-[2px_3px_0_rgba(0,0,0,0.4)] space-y-2">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <h3 className="font-display text-xl font-semibold text-bastion-ink">
          {project.name}
        </h3>
        <div className="flex gap-1 flex-wrap">
          <span
            className={`text-sm uppercase tracking-[0.18em] rounded px-1.5 py-0.5 ${categoryTone[project.category]}`}
          >
            {project.category}
          </span>
          <span className="text-sm uppercase tracking-[0.18em] rounded bg-bastion-oak text-bastion-parchment px-1.5 py-0.5">
            {project.characteristic}
          </span>
          <span
            className={`text-sm uppercase tracking-[0.18em] rounded border px-1.5 py-0.5 ${statusTone[project.status]}`}
          >
            {project.status}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-base text-bastion-ink-soft">
        <div className="flex-1 h-2 rounded bg-bastion-oak/30 overflow-hidden border border-bastion-oak/60">
          <div
            className="h-full bg-bastion-gold transition-all"
            style={{ width: `${pct}%` }}
            aria-hidden
          />
        </div>
        <span className="tabular-nums text-bastion-ink font-semibold">
          {project.current} / {project.goal}
        </span>
        <span className="text-bastion-ink-mute">({pct}%)</span>
      </div>

      {(project.source || project.prerequisite || project.contributors) && (
        <div className="text-base text-bastion-ink-soft space-y-0.5">
          {project.source && (
            <p>
              <span className="uppercase tracking-[0.16em] text-bastion-oak">Source:</span>{' '}
              {project.source}
            </p>
          )}
          {project.prerequisite && (
            <p>
              <span className="uppercase tracking-[0.16em] text-bastion-oak">Prereq:</span>{' '}
              {project.prerequisite}
            </p>
          )}
          {project.contributors && (
            <p>
              <span className="uppercase tracking-[0.16em] text-bastion-oak">Crew:</span>{' '}
              {project.contributors}
            </p>
          )}
        </div>
      )}

      {recent.length > 0 && (
        <ul className="text-base text-bastion-ink space-y-0.5">
          {recent.map((ev) => (
            <li key={ev.id} className="border-l-2 border-bastion-oak/60 pl-2">
              <span className="text-bastion-oak font-bold">W{ev.week}</span>{' '}
              <span className="tabular-nums">
                {ev.d20}
                {ev.modifier >= 0 ? '+' : ''}
                {ev.modifier}
                {ev.edge !== 0 ? ` ${ev.edge > 0 ? '+' : ''}${ev.edge}` : ''}
              </span>
              {' = '}
              <span className="font-semibold">+{ev.pointsAdded} pts</span>
              {ev.breakthrough && (
                <span className="ml-1 text-bastion-crimson font-semibold">★</span>
              )}
              {ev.rollerNote && (
                <span className="text-bastion-ink-mute"> ({ev.rollerNote})</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {isPlayer ? null : rolling ? (
        <RollForm project={project} onCancel={() => setRolling(false)} />
      ) : (
        <div className="flex flex-wrap gap-1.5 text-base">
          {isActive && (
            <button
              type="button"
              onClick={() => setRolling(true)}
              className="banner-ribbon rounded px-2 py-1 font-display tracking-[0.08em] uppercase hover:brightness-110 transition-all"
            >
              Make a roll
            </button>
          )}
          {project.status === 'paused' && (
            <button
              type="button"
              onClick={() => setStatus('active')}
              className="rounded border border-bastion-verdant px-2 py-1 uppercase tracking-wider text-bastion-verdant hover:bg-bastion-verdant/10 transition-colors"
            >
              Resume
            </button>
          )}
          {isActive && (
            <button
              type="button"
              onClick={() => setStatus('paused')}
              className="rounded border border-bastion-ember px-2 py-1 uppercase tracking-wider text-bastion-ember hover:bg-bastion-ember/10 transition-colors"
            >
              Pause
            </button>
          )}
          {(isActive || project.status === 'paused') && (
            <button
              type="button"
              onClick={() => setStatus('abandoned')}
              className="rounded border border-bastion-crimson px-2 py-1 uppercase tracking-wider text-bastion-crimson hover:bg-bastion-crimson/10 transition-colors"
            >
              Abandon
            </button>
          )}
          <button
            type="button"
            onClick={onEdit}
            className="rounded border border-bastion-azure px-2 py-1 uppercase tracking-wider text-bastion-azure hover:bg-bastion-azure/10 transition-colors"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded border border-bastion-oak px-2 py-1 uppercase tracking-wider text-bastion-ink-soft hover:text-bastion-crimson transition-colors"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  )
}

function projectToDraft(p: Project): DraftState {
  return {
    name: p.name,
    category: p.category,
    characteristic: p.characteristic,
    goal: p.goal,
    source: p.source ?? '',
    prerequisite: p.prerequisite ?? '',
    contributors: p.contributors ?? '',
  }
}

export function ProjectsSection() {
  const projects = useBastionStore((s) => s.bastions[s.activeBastionId].projects)
  const addProject = useBastionStore((s) => s.addProject)
  const updateProject = useBastionStore((s) => s.updateProject)
  const removeProject = useBastionStore((s) => s.removeProject)
  const isPlayer = usePlayerView()

  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleAdd = (draft: DraftState) => {
    addProject(draft)
    setAdding(false)
  }

  const handleUpdate = (id: string, draft: DraftState) => {
    updateProject(id, draft)
    setEditingId(null)
  }

  const handleRemove = (project: Project) => {
    if (window.confirm(`Remove ${project.name}? Roll history will be lost.`)) {
      removeProject(project.id)
    }
  }

  const activeCount = projects.filter((p) => p.status === 'active').length

  return (
    <section className="mt-8">
      <div className="flex items-baseline justify-between mb-3 flex-wrap gap-3">
        <h2 className="text-4xl font-bold heading-display font-display tracking-[0.06em]">
          Projects
        </h2>
        <div className="flex items-center gap-3 flex-wrap text-base">
          <span className="uppercase tracking-[0.18em] text-page-muted-strong">
            {activeCount} active · {projects.length} total
          </span>
          {!adding && !isPlayer && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="rounded-md border-2 border-bastion-gold bg-bastion-night/60 px-3 py-1 text-base font-display tracking-[0.06em] uppercase text-bastion-gold-bright hover:bg-bastion-night/40 hover:border-bastion-gold-bright transition-colors focus:outline-none focus:ring-2 focus:ring-bastion-gold-bright"
            >
              + Add project
            </button>
          )}
        </div>
      </div>

      {adding && (
        <div className="mb-3">
          <ProjectForm
            submitLabel="Add"
            onSubmit={handleAdd}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {projects.length === 0 && !adding ? (
        <p className="parchment-surface rounded-md border-[3px] border-bastion-oak p-4 text-lg text-bastion-ink-soft italic shadow-[2px_3px_0_rgba(0,0,0,0.4)]">
          No projects yet. Steel Compendium projects are milestone-based long tasks —
          add one with a goal and roll the listed characteristic each week to make
          progress.
        </p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {projects.map((p) =>
            editingId === p.id ? (
              <li key={p.id}>
                <ProjectForm
                  initial={projectToDraft(p)}
                  submitLabel="Save"
                  onSubmit={(d) => handleUpdate(p.id, d)}
                  onCancel={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li key={p.id}>
                <ProjectCard
                  project={p}
                  onEdit={() => setEditingId(p.id)}
                  onRemove={() => handleRemove(p)}
                />
              </li>
            ),
          )}
        </ul>
      )}
    </section>
  )
}
