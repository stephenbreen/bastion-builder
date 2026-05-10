'use client';
import { useState, type FormEvent } from 'react'
import type { Edge, Project } from '../types'
import { useBastionStore } from '../store/useBastionStore'

interface ProjectRollFormProps {
  project: Project
  onCancel: () => void
}

export function ProjectRollForm({ project, onCancel }: ProjectRollFormProps) {
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
