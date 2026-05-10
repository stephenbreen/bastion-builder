'use client';
import { useState, type FormEvent } from 'react'
import {
  PC_ABILITIES,
  type PC,
  type PCAbility,
} from '../types'
import { useActiveBastionId } from '../hooks/useActiveBastionId'
import { useBastion } from '../hooks/useBastion'
import { useBastionMutation } from '../hooks/useBastionMutation'
import { usePlayerView } from '../lib/view-mode'
import { getFloorLabel } from '../lib/floors'

interface DraftState {
  name: string
  class: string
  level: number
  player: string
  facilityId: string
  notes: string
  scores: Record<PCAbility, string>
}

const emptyScores: Record<PCAbility, string> = {
  STR: '',
  DEX: '',
  CON: '',
  INT: '',
  WIS: '',
  CHA: '',
}

const emptyDraft: DraftState = {
  name: '',
  class: '',
  level: 1,
  player: '',
  facilityId: '',
  notes: '',
  scores: { ...emptyScores },
}

function pcToDraft(pc: PC): DraftState {
  const scores = { ...emptyScores }
  for (const k of PC_ABILITIES) {
    const v = pc.abilityScores?.[k]
    if (v !== undefined) scores[k] = String(v)
  }
  return {
    name: pc.name,
    class: pc.class,
    level: pc.level,
    player: pc.player ?? '',
    facilityId: pc.facilityId ?? '',
    notes: pc.notes ?? '',
    scores,
  }
}

function draftToPayload(draft: DraftState) {
  const abilityScores: Partial<Record<PCAbility, number>> = {}
  for (const k of PC_ABILITIES) {
    const v = draft.scores[k]
    if (v.trim() === '') continue
    const n = Number(v)
    if (Number.isFinite(n)) abilityScores[k] = n
  }
  return {
    name: draft.name,
    class: draft.class,
    level: draft.level,
    player: draft.player || undefined,
    facilityId: draft.facilityId || undefined,
    notes: draft.notes || undefined,
    abilityScores: Object.keys(abilityScores).length > 0 ? abilityScores : undefined,
  }
}

interface PCFormProps {
  initial?: DraftState
  submitLabel: string
  onSubmit: (draft: DraftState) => void
  onCancel: () => void
}

function PCForm({ initial, submitLabel, onSubmit, onCancel }: PCFormProps) {
  const bastionId = useActiveBastionId()
  const facilities = useBastion(bastionId).data?.state.facilities ?? []
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <input
          autoFocus
          value={draft.name}
          onChange={(e) => update('name', e.target.value)}
          placeholder="PC name"
          aria-label="PC name"
          required
          className="rounded border border-bastion-oak bg-bastion-parchment-warm px-2 py-1 text-lg text-bastion-ink placeholder:text-bastion-ink-mute focus:outline-none focus:ring-2 focus:ring-bastion-crimson md:col-span-2"
        />
        <input
          value={draft.class}
          onChange={(e) => update('class', e.target.value)}
          placeholder="Class (Bard, Fighter…)"
          aria-label="Class"
          className="rounded border border-bastion-oak bg-bastion-parchment-warm px-2 py-1 text-lg text-bastion-ink placeholder:text-bastion-ink-mute focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
        />
        <label className="flex items-center gap-2 text-base text-bastion-ink-soft">
          <span className="uppercase tracking-wider">Level</span>
          <input
            type="number"
            min={1}
            max={20}
            value={draft.level}
            onChange={(e) => update('level', Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
            aria-label="Level"
            className="w-16 rounded border border-bastion-oak bg-bastion-parchment-warm px-2 py-1 text-lg text-bastion-ink focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <input
          value={draft.player}
          onChange={(e) => update('player', e.target.value)}
          placeholder="Player (optional)"
          aria-label="Player name"
          className="rounded border border-bastion-oak bg-bastion-parchment-warm px-2 py-1 text-lg text-bastion-ink placeholder:text-bastion-ink-mute focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
        />
        <select
          value={draft.facilityId}
          onChange={(e) => update('facilityId', e.target.value)}
          aria-label="Stationed at facility"
          className="rounded border border-bastion-oak bg-bastion-parchment-warm px-2 py-1 text-lg text-bastion-ink focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
        >
          <option value="">Not stationed</option>
          {facilities.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="rounded border border-bastion-oak/60 bg-bastion-parchment-warm/40 p-2">
        <legend className="px-1 text-sm uppercase tracking-[0.18em] text-bastion-oak font-semibold">
          Ability scores (optional)
        </legend>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mt-1">
          {PC_ABILITIES.map((a) => (
            <label key={a} className="flex flex-col items-center gap-0.5">
              <span className="text-sm uppercase tracking-[0.16em] text-bastion-ink-mute">
                {a}
              </span>
              <input
                type="number"
                min={1}
                max={30}
                value={draft.scores[a]}
                onChange={(e) =>
                  update('scores', { ...draft.scores, [a]: e.target.value })
                }
                placeholder="—"
                aria-label={`${a} score`}
                className="w-14 rounded border border-bastion-oak bg-bastion-parchment px-1 py-0.5 text-lg text-bastion-ink text-center focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
              />
            </label>
          ))}
        </div>
      </fieldset>

      <textarea
        value={draft.notes}
        onChange={(e) => update('notes', e.target.value)}
        placeholder="Notes — race, background, vendetta against the lich, anything"
        aria-label="Notes"
        rows={2}
        className="w-full rounded border border-bastion-oak bg-bastion-parchment-warm px-2 py-1 text-lg text-bastion-ink placeholder:text-bastion-ink-mute focus:outline-none focus:ring-2 focus:ring-bastion-crimson resize-y font-serif"
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

interface PCRowProps {
  pc: PC
  facilityName: string | null
  onEdit: () => void
  onRemove: () => void
  readOnly?: boolean
}

function PCRow({ pc, facilityName, onEdit, onRemove, readOnly }: PCRowProps) {
  const scores = pc.abilityScores
  return (
    <div className="parchment-surface rounded-md border-2 border-bastion-oak p-3 shadow-[1px_2px_0_rgba(0,0,0,0.4)] flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <div className="flex items-baseline gap-2 flex-wrap">
          <h4 className="font-display text-2xl font-semibold text-bastion-ink">
            {pc.name}
          </h4>
          <span className="text-sm uppercase tracking-[0.18em] rounded bg-bastion-oak text-bastion-parchment px-1.5 py-0.5">
            {pc.class} · L{pc.level}
          </span>
          {pc.player && (
            <span className="text-sm italic text-bastion-ink-soft">
              ({pc.player})
            </span>
          )}
        </div>
        {!readOnly && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Edit ${pc.name}`}
              className="text-base uppercase tracking-wider text-bastion-azure hover:underline"
            >
              edit
            </button>
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${pc.name}`}
              className="text-base uppercase tracking-wider text-bastion-crimson hover:underline"
            >
              remove
            </button>
          </div>
        )}
      </div>
      {scores && (
        <div className="flex flex-wrap gap-1.5">
          {PC_ABILITIES.map((a) =>
            scores[a] !== undefined ? (
              <span
                key={a}
                className="rounded border border-bastion-oak/60 bg-bastion-parchment-warm/60 px-1.5 py-0.5 text-sm tabular-nums"
              >
                <span className="uppercase tracking-[0.14em] text-bastion-ink-mute mr-1">
                  {a}
                </span>
                <span className="font-semibold text-bastion-ink">{scores[a]}</span>
              </span>
            ) : null,
          )}
        </div>
      )}
      {facilityName && (
        <p className="text-base text-bastion-ink-soft">
          <span className="uppercase tracking-[0.16em] text-bastion-oak">Stationed:</span>{' '}
          {facilityName}
        </p>
      )}
      {pc.notes && (
        <p className="text-base text-bastion-ink-soft whitespace-pre-line">
          {pc.notes}
        </p>
      )}
    </div>
  )
}

export function PCsSection() {
  const bastionId = useActiveBastionId()
  const bastion = useBastion(bastionId).data?.state
  const { addPc, updatePc, removePc } = useBastionMutation(bastionId)
  const isPlayer = usePlayerView()
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  if (!bastion) return null

  const pcs = bastion.pcs ?? []

  const facilityNameOf = (id?: string): string | null => {
    if (!id) return null
    const f = bastion.facilities.find((x) => x.id === id)
    if (!f) return null
    const floor = f.floor ? ` · ${getFloorLabel(bastion, f.floor)}` : ''
    return `${f.name}${floor}`
  }

  const handleAdd = (draft: DraftState) => {
    const result = addPc(draftToPayload(draft))
    if (result.ok) setAdding(false)
  }

  const handleUpdate = (id: string, draft: DraftState) => {
    const result = updatePc(id, draftToPayload(draft))
    if (result.ok) setEditingId(null)
  }

  const handleRemove = (pc: PC) => {
    if (window.confirm(`Remove ${pc.name} from the party?`)) {
      removePc(pc.id)
    }
  }

  return (
    <section className="mt-8">
      <div className="flex items-baseline justify-between mb-3 flex-wrap gap-3">
        <h2 className="text-4xl font-bold heading-display font-display tracking-[0.06em]">
          Party
        </h2>
        <div className="flex items-center gap-3 flex-wrap text-base">
          <span className="uppercase tracking-[0.18em] text-page-muted-strong">
            {pcs.length} character{pcs.length === 1 ? '' : 's'}
          </span>
          {!adding && !isPlayer && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="rounded-md border-2 border-bastion-gold bg-bastion-night/60 px-3 py-1 text-base font-display tracking-[0.06em] uppercase text-bastion-gold-bright hover:bg-bastion-night/40 hover:border-bastion-gold-bright transition-colors focus:outline-none focus:ring-2 focus:ring-bastion-gold-bright"
            >
              + Add PC
            </button>
          )}
        </div>
      </div>

      {adding && (
        <div className="mb-3">
          <PCForm
            submitLabel="Add"
            onSubmit={handleAdd}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {pcs.length === 0 && !adding ? (
        <p className="parchment-surface rounded-md border-[3px] border-bastion-oak p-4 text-lg text-bastion-ink-soft italic shadow-[2px_3px_0_rgba(0,0,0,0.4)]">
          No PCs yet. Add the party so the bastion has rightful owners — assign
          them to rooms with the "Stationed at" field.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {pcs.map((pc) =>
            editingId === pc.id ? (
              <li key={pc.id}>
                <PCForm
                  initial={pcToDraft(pc)}
                  submitLabel="Save"
                  onSubmit={(d) => handleUpdate(pc.id, d)}
                  onCancel={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li key={pc.id}>
                <PCRow
                  pc={pc}
                  facilityName={facilityNameOf(pc.facilityId)}
                  onEdit={() => setEditingId(pc.id)}
                  onRemove={() => handleRemove(pc)}
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
