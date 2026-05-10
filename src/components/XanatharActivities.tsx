import { useState, type FormEvent } from 'react'
import {
  XANATHAR_ACTIVITIES,
  type XanatharActivity,
} from '../data/xanathar-activities'
import { useBastionStore } from '../store/useBastionStore'
import { usePlayerView } from '../lib/view-mode'

interface RecordFormProps {
  activity: XanatharActivity
  onClose: () => void
}

function RecordForm({ activity, onClose }: RecordFormProps) {
  const recordActivity = useBastionStore((s) => s.recordActivity)
  const [roller, setRoller] = useState('')
  const [outcome, setOutcome] = useState('')
  const [rollComplication, setRollComplication] = useState(false)
  const [lastResult, setLastResult] = useState<{
    roll: number | null
    text: string | null
  } | null>(null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const result = recordActivity({
      activityId: activity.id,
      roller,
      outcome,
      rollComplication,
    })
    if (!result.ok) return
    setLastResult({
      roll: result.complication?.roll ?? null,
      text: result.complication?.text ?? null,
    })
    setRoller('')
    setOutcome('')
    setRollComplication(false)
  }

  return (
    <form
      onSubmit={submit}
      className="rounded border-2 border-bastion-crimson bg-bastion-crimson/5 p-2 space-y-2"
    >
      <input
        autoFocus
        value={roller}
        onChange={(e) => setRoller(e.target.value)}
        placeholder="Roller (e.g. Mira)"
        aria-label={`Roller for ${activity.name}`}
        className="w-full rounded border border-bastion-oak bg-bastion-parchment-warm px-2 py-1 text-base text-bastion-ink placeholder:text-bastion-ink-mute focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
      />
      <textarea
        value={outcome}
        onChange={(e) => setOutcome(e.target.value)}
        placeholder="Outcome / narrative (check total, contacts gained, etc.)"
        aria-label={`Outcome for ${activity.name}`}
        rows={2}
        className="w-full rounded border border-bastion-oak bg-bastion-parchment-warm px-2 py-1 text-base text-bastion-ink placeholder:text-bastion-ink-mute focus:outline-none focus:ring-2 focus:ring-bastion-crimson resize-y"
      />
      <label className="flex items-center gap-2 text-base text-bastion-ink-soft">
        <input
          type="checkbox"
          checked={rollComplication}
          onChange={(e) => setRollComplication(e.target.checked)}
          className="accent-bastion-crimson"
        />
        Roll d{activity.complicationDie} complication
      </label>
      {lastResult && lastResult.roll !== null && (
        <div className="rounded bg-bastion-parchment-warm/60 px-2 py-1 text-base text-bastion-ink">
          <span className="font-bold text-bastion-crimson">
            d{activity.complicationDie} = {lastResult.roll}
          </span>{' '}
          {lastResult.text}
        </div>
      )}
      {lastResult && lastResult.roll === null && (
        <div className="rounded bg-bastion-parchment-warm/60 px-2 py-1 text-base text-bastion-ink">
          Recorded.
        </div>
      )}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-bastion-oak px-2 py-1 text-base uppercase tracking-wider text-bastion-ink-soft hover:text-bastion-ink transition-colors"
        >
          Close
        </button>
        <button
          type="submit"
          className="banner-ribbon rounded px-3 py-1 text-base font-display tracking-[0.08em] uppercase hover:brightness-110 transition-all"
        >
          Record
        </button>
      </div>
    </form>
  )
}

interface ActivityCardProps {
  activity: XanatharActivity
}

function ActivityCard({ activity }: ActivityCardProps) {
  const isPlayer = usePlayerView()
  const [open, setOpen] = useState(false)
  const [recording, setRecording] = useState(false)

  return (
    <div className="parchment-surface rounded-md border-2 border-bastion-oak p-3 shadow-[1px_2px_0_rgba(0,0,0,0.4)] space-y-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left flex items-baseline justify-between gap-2"
        aria-expanded={open}
      >
        <h3 className="font-display text-lg font-semibold text-bastion-ink">
          {activity.name}
        </h3>
        <span className="text-sm uppercase tracking-[0.2em] text-bastion-oak">
          {open ? '−' : '+'}
        </span>
      </button>
      <p className="text-base text-bastion-ink-soft italic">{activity.summary}</p>

      {open && (
        <div className="space-y-2 text-base text-bastion-ink">
          <dl className="grid grid-cols-[max-content_1fr] gap-x-2 gap-y-0.5">
            <dt className="uppercase tracking-[0.16em] text-bastion-oak">Time</dt>
            <dd>{activity.workweeks} workweek{activity.workweeks === '1' ? '' : 's'}</dd>
            <dt className="uppercase tracking-[0.16em] text-bastion-oak">Cost</dt>
            <dd>{activity.goldCost}</dd>
            <dt className="uppercase tracking-[0.16em] text-bastion-oak">Check</dt>
            <dd>{activity.skill}</dd>
            <dt className="uppercase tracking-[0.16em] text-bastion-oak">Result</dt>
            <dd>{activity.resolutionHint}</dd>
            <dt className="uppercase tracking-[0.16em] text-bastion-oak">Compl.</dt>
            <dd>d{activity.complicationDie} table ({activity.complications.length} entries)</dd>
          </dl>
          {activity.notes && (
            <p className="text-base text-bastion-ink-mute italic">{activity.notes}</p>
          )}
          <details className="text-base text-bastion-ink-soft">
            <summary className="cursor-pointer text-bastion-oak font-semibold">
              Show complications table
            </summary>
            <ul className="mt-1 space-y-0.5">
              {activity.complications.map((c) => (
                <li key={c.roll}>
                  <span className="font-bold tabular-nums">{c.roll}.</span> {c.text}
                </li>
              ))}
            </ul>
          </details>
          {isPlayer ? null : recording ? (
            <RecordForm
              activity={activity}
              onClose={() => setRecording(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setRecording(true)}
              className="rounded border border-bastion-crimson px-2 py-1 text-base uppercase tracking-wider text-bastion-crimson hover:bg-bastion-crimson hover:text-bastion-parchment transition-colors"
            >
              Record outcome
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function RecentActivityFeed() {
  const log = useBastionStore((s) => s.bastions[s.activeBastionId].log)
  const recent = log
    .filter((e) => e.type === 'xanathar-activity')
    .slice(-5)
    .reverse()

  if (recent.length === 0) return null

  return (
    <div className="parchment-surface rounded-md border-2 border-bastion-oak p-3 shadow-[1px_2px_0_rgba(0,0,0,0.4)]">
      <h3 className="text-base uppercase tracking-[0.25em] text-bastion-oak font-bold mb-2">
        Recent activity
      </h3>
      <ul className="space-y-1.5 text-base text-bastion-ink">
        {recent.map((entry) => (
          <li key={entry.id} className="flex gap-2 border-l-2 border-bastion-oak/60 pl-2">
            <span className="text-bastion-oak font-bold tabular-nums shrink-0">
              W{entry.week}
            </span>
            <span>{entry.outcome}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function XanatharActivities() {
  return (
    <section className="mt-8">
      <div className="flex items-baseline justify-between mb-3 flex-wrap gap-3">
        <h2 className="text-4xl font-bold heading-display font-display tracking-[0.06em]">
          Downtime activities
        </h2>
        <span className="text-base uppercase tracking-[0.18em] text-page-muted-strong">
          XGtE catalogue · {XANATHAR_ACTIVITIES.length} activities
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-4">
        {XANATHAR_ACTIVITIES.map((a) => (
          <ActivityCard key={a.id} activity={a} />
        ))}
      </div>

      <RecentActivityFeed />
    </section>
  )
}
