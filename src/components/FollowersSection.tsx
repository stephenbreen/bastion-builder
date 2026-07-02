'use client';
import { useState, type FormEvent } from 'react'
import {
  FOLLOWER_ROLES,
  FOLLOWER_SOURCES,
  type Follower,
  type FollowerRole,
  type FollowerSource,
} from '../types'
import { useBastionStore } from '../store/useBastionStore'
import { followerSlotUsage } from '../lib/format'
import { usePlayerView } from '../lib/view-mode'

interface DraftState {
  name: string
  role: FollowerRole
  source: FollowerSource
  bonus: string
  assignment: string
  notes: string
}

const emptyDraft: DraftState = {
  name: '',
  role: 'Project Helper',
  source: 'renown',
  bonus: '',
  assignment: '',
  notes: '',
}

const sourceTone: Record<FollowerSource, string> = {
  renown: 'bg-bastion-crimson text-bastion-parchment',
  stronghold: 'bg-bastion-azure text-bastion-parchment',
}

interface FollowerFormProps {
  initial?: DraftState
  submitLabel: string
  onSubmit: (draft: DraftState) => void
  onCancel: () => void
}

function FollowerForm({ initial, submitLabel, onSubmit, onCancel }: FollowerFormProps) {
  const [draft, setDraft] = useState<DraftState>(initial ?? emptyDraft)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!draft.name.trim()) return
    onSubmit(draft)
  }

  const update = <K extends keyof DraftState>(key: K, value: DraftState[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  return (
    <form
      onSubmit={handleSubmit}
      className="parchment-surface rounded-md border-2 border-bastion-oak p-3 space-y-2 shadow-[1px_2px_0_rgba(0,0,0,0.4)]"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <input
          autoFocus
          value={draft.name}
          onChange={(e) => update('name', e.target.value)}
          placeholder="Name"
          aria-label="Follower name"
          required
          className="rounded border border-bastion-oak bg-bastion-parchment-warm px-2 py-1 text-lg text-bastion-ink placeholder:text-bastion-ink-mute focus:outline-none focus:ring-2 focus:ring-bastion-crimson md:col-span-1"
        />
        <select
          value={draft.role}
          onChange={(e) => update('role', e.target.value as FollowerRole)}
          aria-label="Role"
          className="rounded border border-bastion-oak bg-bastion-parchment-warm px-2 py-1 text-lg text-bastion-ink focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
        >
          {FOLLOWER_ROLES.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <select
          value={draft.source}
          onChange={(e) => update('source', e.target.value as FollowerSource)}
          aria-label="Source"
          className="rounded border border-bastion-oak bg-bastion-parchment-warm px-2 py-1 text-lg text-bastion-ink focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
        >
          {FOLLOWER_SOURCES.map((s) => (
            <option key={s} value={s}>
              {s === 'renown' ? 'Renown unlock' : 'Stronghold roll'}
            </option>
          ))}
        </select>
      </div>
      <input
        value={draft.bonus}
        onChange={(e) => update('bonus', e.target.value)}
        placeholder="Bonus (e.g. +2 Reason on Research projects)"
        aria-label="Bonus"
        className="w-full rounded border border-bastion-oak bg-bastion-parchment-warm px-2 py-1 text-lg text-bastion-ink placeholder:text-bastion-ink-mute focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
      />
      <input
        value={draft.assignment}
        onChange={(e) => update('assignment', e.target.value)}
        placeholder="Assignment (e.g. Library, Mira's research project, unassigned)"
        aria-label="Assignment"
        className="w-full rounded border border-bastion-oak bg-bastion-parchment-warm px-2 py-1 text-lg text-bastion-ink placeholder:text-bastion-ink-mute focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
      />
      <textarea
        value={draft.notes}
        onChange={(e) => update('notes', e.target.value)}
        placeholder="Notes (optional)"
        aria-label="Notes"
        rows={2}
        className="w-full rounded border border-bastion-oak bg-bastion-parchment-warm px-2 py-1 text-lg text-bastion-ink placeholder:text-bastion-ink-mute focus:outline-none focus:ring-2 focus:ring-bastion-crimson resize-y"
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
          disabled={!draft.name.trim()}
          className="banner-ribbon rounded px-3 py-1 text-base font-display tracking-[0.08em] uppercase hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  )
}

interface FollowerRowProps {
  follower: Follower
  onEdit: () => void
  onRemove: () => void
  readOnly?: boolean
}

function FollowerRow({ follower, onEdit, onRemove, readOnly }: FollowerRowProps) {
  return (
    <div className="parchment-surface rounded-md border-2 border-bastion-oak p-3 shadow-[1px_2px_0_rgba(0,0,0,0.4)] flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <div className="flex items-baseline gap-2 flex-wrap">
          <h4 className="font-display text-xl font-semibold text-bastion-ink">
            {follower.name}
          </h4>
          <span className="text-base uppercase tracking-[0.18em] rounded bg-bastion-oak text-bastion-parchment px-1.5 py-0.5">
            {follower.role}
          </span>
          <span
            className={`text-sm uppercase tracking-[0.18em] rounded px-1.5 py-0.5 ${sourceTone[follower.source]}`}
          >
            {follower.source}
          </span>
        </div>
        {!readOnly && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Edit ${follower.name}`}
              className="text-base uppercase tracking-wider text-bastion-azure hover:underline"
            >
              edit
            </button>
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${follower.name}`}
              className="text-base uppercase tracking-wider text-bastion-crimson hover:underline"
            >
              remove
            </button>
          </div>
        )}
      </div>
      {follower.bonus && (
        <p className="text-base text-bastion-ink italic">{follower.bonus}</p>
      )}
      {follower.assignment && (
        <p className="text-base text-bastion-ink-soft">
          <span className="uppercase tracking-[0.16em] text-bastion-oak">Assigned:</span>{' '}
          {follower.assignment}
        </p>
      )}
      {follower.notes && (
        <p className="text-base text-bastion-ink-soft whitespace-pre-line">
          {follower.notes}
        </p>
      )}
    </div>
  )
}

function followerToDraft(f: Follower): DraftState {
  return {
    name: f.name,
    role: f.role,
    source: f.source,
    bonus: f.bonus ?? '',
    assignment: f.assignment ?? '',
    notes: f.notes ?? '',
  }
}

export function FollowersSection() {
  const followers = useBastionStore((s) => s.bastions[s.activeBastionId].followers)
  const renown = useBastionStore((s) => s.bastions[s.activeBastionId].domain.renown)
  const addFollower = useBastionStore((s) => s.addFollower)
  const updateFollower = useBastionStore((s) => s.updateFollower)
  const removeFollower = useBastionStore((s) => s.removeFollower)

  const isPlayer = usePlayerView()
  const usage = followerSlotUsage(followers, renown)
  const overFilled = usage.used > usage.unlocked
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleAdd = (draft: DraftState) => {
    addFollower(draft)
    setAdding(false)
  }

  const handleUpdate = (id: string, draft: DraftState) => {
    updateFollower(id, draft)
    setEditingId(null)
  }

  const handleRemove = (f: Follower) => {
    if (window.confirm(`Remove ${f.name} from your followers?`)) {
      removeFollower(f.id)
    }
  }

  return (
    <section className="mt-8">
      <div className="flex items-baseline justify-between mb-3 flex-wrap gap-3">
        <h2 className="text-4xl font-bold heading-display font-display tracking-[0.06em]">
          Followers
        </h2>
        <div className="flex items-center gap-3 flex-wrap text-base">
          <span
            className={`uppercase tracking-[0.18em] ${overFilled ? 'text-bastion-crimson' : 'text-page-muted-strong'}`}
          >
            {usage.used} / {usage.unlocked} renown slots used
            {overFilled && ' (over!)'}
          </span>
          {!adding && !isPlayer && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="rounded-md border-2 border-bastion-gold bg-bastion-night/60 px-3 py-1 text-base font-display tracking-[0.06em] uppercase text-bastion-gold-bright hover:bg-bastion-night/40 hover:border-bastion-gold-bright transition-colors focus:outline-none focus:ring-2 focus:ring-bastion-gold-bright"
            >
              + Add follower
            </button>
          )}
        </div>
      </div>

      {adding && (
        <div className="mb-3">
          <FollowerForm
            submitLabel="Add"
            onSubmit={handleAdd}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {followers.length === 0 && !adding ? (
        <p className="parchment-surface rounded-md border-[3px] border-bastion-oak p-4 text-lg text-bastion-ink-soft italic shadow-[2px_3px_0_rgba(0,0,0,0.4)]">
          No followers yet. Renown thresholds at 3 / 6 / 9 / 12 each unlock a follower
          slot, and stronghold level-ups grant a roll on the Aspect's class follower table.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {followers.map((f) =>
            editingId === f.id ? (
              <li key={f.id}>
                <FollowerForm
                  initial={followerToDraft(f)}
                  submitLabel="Save"
                  onSubmit={(d) => handleUpdate(f.id, d)}
                  onCancel={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li key={f.id}>
                <FollowerRow
                  follower={f}
                  onEdit={() => setEditingId(f.id)}
                  onRemove={() => handleRemove(f)}
                  readOnly={isPlayer}
                />
              </li>
            ),
          )}
        </ul>
      )}
    </section>
  )
}
