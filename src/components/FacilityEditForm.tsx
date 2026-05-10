'use client';
import { useState } from 'react'
import type {
  Facility,
  FacilityCategory,
  FacilityState,
} from '../types'
import { FACILITY_CATEGORIES } from '../types'
import { useActiveBastionId } from '../hooks/useActiveBastionId'
import { useBastionMutation } from '../hooks/useBastionMutation'

const FACILITY_STATES: FacilityState[] = ['active', 'damaged', 'disabled']

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

interface FacilityEditFormProps {
  facility: Facility
  onClose: () => void
}

export function FacilityEditForm({ facility, onClose }: FacilityEditFormProps) {
  const bastionId = useActiveBastionId()
  const { updateFacility } = useBastionMutation(bastionId)
  const [name, setName] = useState(facility.name)
  const [category, setCategory] = useState<FacilityCategory>(
    facility.category ?? 'production',
  )
  const [state, setState] = useState<FacilityState>(facility.state)
  const [notes, setNotes] = useState(facility.notes ?? '')
  const [error, setError] = useState<string | null>(null)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const result = updateFacility(facility.id, {
      name,
      category,
      // Under-construction is managed by the build/turn engine, not this form.
      state: facility.state === 'under-construction' ? facility.state : state,
      notes: notes.trim() || null,
    })
    if (result.ok) {
      setError(null)
      onClose()
    } else {
      setError(result.reason)
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded border-2 border-bastion-azure bg-bastion-azure/5 p-3 space-y-2.5"
    >
      {error && (
        <div className="rounded border-2 border-bastion-crimson bg-bastion-crimson/10 px-3 py-1.5 text-base text-bastion-crimson font-semibold">
          {error}
        </div>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-sm uppercase tracking-[0.18em] text-bastion-oak font-semibold">
          Name
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
          className="rounded border-2 border-bastion-oak bg-bastion-parchment-warm px-2 py-1 text-lg text-bastion-ink focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
        />
      </label>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm uppercase tracking-[0.18em] text-bastion-oak font-semibold">
            Category
          </span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as FacilityCategory)}
            className="rounded border-2 border-bastion-oak bg-bastion-parchment-warm px-2 py-1 text-lg text-bastion-ink focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
          >
            {FACILITY_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {cap(c)}
              </option>
            ))}
          </select>
        </label>

        {facility.state !== 'under-construction' ? (
          <label className="flex flex-col gap-1">
            <span className="text-sm uppercase tracking-[0.18em] text-bastion-oak font-semibold">
              State
            </span>
            <select
              value={state}
              onChange={(e) => setState(e.target.value as FacilityState)}
              className="rounded border-2 border-bastion-oak bg-bastion-parchment-warm px-2 py-1 text-lg text-bastion-ink focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
            >
              {FACILITY_STATES.map((s) => (
                <option key={s} value={s}>
                  {cap(s)}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="flex flex-col gap-1">
            <span className="text-sm uppercase tracking-[0.18em] text-bastion-oak font-semibold">
              State
            </span>
            <span className="rounded border-2 border-bastion-ember bg-bastion-ember/10 px-2 py-1 text-lg text-bastion-ember italic">
              Under construction (advance the week to finish)
            </span>
          </div>
        )}
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm uppercase tracking-[0.18em] text-bastion-oak font-semibold">
          Notes
        </span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Lore, mechanical reminders…"
          className="rounded border-2 border-bastion-oak bg-bastion-parchment-warm px-2 py-1 text-lg text-bastion-ink placeholder:text-bastion-ink-mute focus:outline-none focus:ring-2 focus:ring-bastion-crimson resize-y font-serif"
        />
      </label>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="rounded border-2 border-bastion-oak bg-bastion-parchment-warm px-3 py-1 text-base uppercase tracking-wider text-bastion-ink hover:border-bastion-crimson focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded border-2 border-bastion-gold bg-bastion-night/60 px-3 py-1 text-base font-display tracking-[0.06em] uppercase text-bastion-gold-bright hover:bg-bastion-night/40 hover:border-bastion-gold-bright focus:outline-none focus:ring-2 focus:ring-bastion-gold-bright"
        >
          Save changes
        </button>
      </div>
    </form>
  )
}
