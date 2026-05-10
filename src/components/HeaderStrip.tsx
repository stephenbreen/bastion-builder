'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useActiveBastionId } from '../hooks/useActiveBastionId'
import { useBastion } from '../hooks/useBastion'
import { useBastionMutation } from '../hooks/useBastionMutation'
import { ASPECT_LIST, type Aspect } from '../types'
import { ASPECT_INFO } from '../data/aspect-info'
import { quoteNextUpgrade } from '../data/stronghold-levels'
import { computeWeeklyTotal } from '../lib/costs'
import { BastionSwitcher } from './BastionSwitcher'
import {
  formatGp,
  formatWeeksSinceIntrigue,
  nextRenownThreshold,
  specialSlotsTotal,
  totalInvested,
  weeksSinceIntrigue,
} from '../lib/format'
import { usePlayerView } from '../lib/view-mode'

interface StatProps {
  label: string
  value: ReactNode
  tone?: 'default' | 'gold' | 'crimson' | 'azure' | 'verdant' | 'muted'
}

const toneClass: Record<NonNullable<StatProps['tone']>, string> = {
  default: 'text-bastion-parchment',
  gold: 'text-bastion-gold-bright',
  crimson: 'text-[#e35e63]',
  azure: 'text-[#7bb6ff]',
  verdant: 'text-[#7fc26a]',
  muted: 'text-bastion-parchment/60',
}

function TreasuryEditor({ value }: { value: number }) {
  const bastionId = useActiveBastionId()
  const { setTreasury } = useBastionMutation(bastionId)
  const isPlayer = usePlayerView()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      setDraft(String(value))
      requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      })
    }
  }, [editing, value])

  if (isPlayer) {
    const negative = value < 0
    return (
      <span className={negative ? 'text-bastion-crimson' : 'text-bastion-gold-bright'}>
        {formatGp(value)}
      </span>
    )
  }

  const commit = () => {
    const parsed = Number(draft)
    if (Number.isFinite(parsed)) setTreasury(parsed)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min={0}
        step={1}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          else if (e.key === 'Escape') setEditing(false)
        }}
        aria-label="Treasury (gp)"
        className="w-28 rounded border border-bastion-gold bg-bastion-shadow/60 px-1.5 py-0.5 text-2xl text-bastion-gold-bright focus:outline-none focus:ring-2 focus:ring-bastion-gold"
      />
    )
  }

  const negative = value < 0
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title={
        negative
          ? `Treasury is in arrears (${formatGp(value)}). Click to edit.`
          : 'Click to edit treasury'
      }
      className={[
        'text-left transition-colors decoration-bastion-gold/40 underline-offset-4 hover:underline',
        negative
          ? 'text-bastion-crimson hover:text-[#ff5d63]'
          : 'text-bastion-gold-bright hover:text-bastion-gold-bright/80',
      ].join(' ')}
    >
      {formatGp(value)}
    </button>
  )
}

function AspectEditor() {
  const bastionId = useActiveBastionId()
  const bastion = useBastion(bastionId).data?.state
  const { switchAspect, cancelAspectSwitch } = useBastionMutation(bastionId)
  const aspect = bastion?.aspect
  const pending = bastion?.pendingAspect
  const isPlayer = usePlayerView()
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const selectRef = useRef<HTMLSelectElement>(null)

  useEffect(() => {
    if (editing) requestAnimationFrame(() => selectRef.current?.focus())
  }, [editing])

  if (!aspect) return null

  if (isPlayer) {
    if (pending) {
      return (
        <span className="text-bastion-gold-bright">
          {aspect}
          <span className="text-bastion-parchment/80"> → </span>
          <span className="text-bastion-ember">{pending.aspect}</span>
        </span>
      )
    }
    return <span className="text-bastion-gold-bright">{aspect}</span>
  }

  const info = ASPECT_INFO[aspect]
  const aspectTitle = `${aspect} — ${info.strongholdType}\n${info.flavour}\nFollowers: ${info.followers}`

  if (pending) {
    return (
      <span className="flex flex-col gap-0.5">
        <span className="text-bastion-gold-bright" title={aspectTitle}>
          {aspect}
          <span className="text-bastion-parchment/80"> → </span>
          <span className="text-bastion-ember">{pending.aspect}</span>
        </span>
        <span className="text-sm text-bastion-parchment/80 italic">
          Resolves on next advance — 500 gp held in escrow.
        </span>
        <button
          type="button"
          onClick={cancelAspectSwitch}
          title={`Cancel pending switch (refunds 500 gp). Initiated W${pending.queuedAtWeek}.`}
          className="self-start text-sm uppercase tracking-[0.18em] text-bastion-crimson hover:text-bastion-gold-bright transition-colors"
        >
          cancel switch
        </button>
      </span>
    )
  }

  if (editing) {
    return (
      <span className="flex flex-col gap-1">
        <select
          ref={selectRef}
          defaultValue={aspect}
          onChange={(e) => {
            const target = e.target.value as Aspect
            if (target === aspect) {
              setEditing(false)
              setError(null)
              return
            }
            const result = switchAspect(target)
            if (result.ok) {
              setEditing(false)
              setError(null)
            } else {
              setError(result.reason)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setEditing(false)
              setError(null)
            }
          }}
          aria-label="Aspect"
          className="rounded border border-bastion-gold bg-bastion-shadow/60 px-1.5 py-0.5 text-xl text-bastion-gold-bright focus:outline-none focus:ring-2 focus:ring-bastion-gold"
        >
          {ASPECT_LIST.map((a) => (
            <option key={a} value={a} className="text-bastion-ink">
              {a} — {ASPECT_INFO[a].strongholdType}
            </option>
          ))}
        </select>
        <span className="text-sm text-bastion-parchment/60 italic max-w-xs">
          Switching costs 500 gp + resolves next week.{' '}
          <button
            type="button"
            onClick={() => {
              setEditing(false)
              setError(null)
            }}
            className="not-italic uppercase tracking-wider text-bastion-parchment/60 hover:text-bastion-gold-bright transition-colors"
          >
            cancel
          </button>
        </span>
        {error && (
          <span className="text-sm text-bastion-crimson" role="alert">
            {error}
          </span>
        )}
      </span>
    )
  }

  return (
    <span className="flex flex-col gap-0.5">
      <button
        type="button"
        onClick={() => {
          setEditing(true)
          setError(null)
        }}
        title={aspectTitle}
        className="self-start text-bastion-gold-bright hover:text-bastion-parchment transition-colors decoration-bastion-gold/40 underline-offset-4 hover:underline"
      >
        {aspect}
      </button>
      <span className="text-sm text-bastion-parchment/80">
        {info.strongholdType}
      </span>
      {error && (
        <span className="text-sm text-bastion-crimson" role="alert">
          {error}
        </span>
      )}
    </span>
  )
}

function RenownEditor() {
  const bastionId = useActiveBastionId()
  const bastion = useBastion(bastionId).data?.state
  const renown = bastion?.domain.renown ?? 0
  const { adjustDomainRenown } = useBastionMutation(bastionId)
  const isPlayer = usePlayerView()
  const nextRenown = nextRenownThreshold(renown)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(renown))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      setDraft(String(renown))
      requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      })
    }
  }, [editing, renown])

  if (isPlayer) {
    return (
      <span className="flex items-center gap-2">
        <span className="text-[#e35e63]">{renown}</span>
        {nextRenown === null ? (
          <span className="text-bastion-parchment/60 text-base">(max)</span>
        ) : (
          <span className="text-bastion-parchment/60">/ {nextRenown}</span>
        )}
      </span>
    )
  }

  const commit = () => {
    const parsed = Math.max(0, Math.trunc(Number(draft)))
    if (Number.isFinite(parsed) && parsed !== renown) {
      adjustDomainRenown(parsed - renown, 'manual')
    }
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min={0}
        step={1}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          else if (e.key === 'Escape') setEditing(false)
        }}
        aria-label="Domain renown"
        className="w-20 rounded border border-bastion-crimson bg-bastion-shadow/60 px-1.5 py-0.5 text-2xl text-[#e35e63] focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
      />
    )
  }

  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setEditing(true)}
        title="Click to edit domain renown"
        className="text-[#e35e63] hover:brightness-110 transition-all decoration-bastion-crimson/40 underline-offset-4 hover:underline"
      >
        {renown}
      </button>
      {nextRenown === null ? (
        <span className="text-bastion-parchment/60 text-base">(max)</span>
      ) : (
        <span className="text-bastion-parchment/60">/ {nextRenown}</span>
      )}
      <span className="flex gap-0.5">
        <button
          type="button"
          onClick={() => adjustDomainRenown(-1, 'quick')}
          aria-label="Lower renown by 1"
          title="-1"
          className="rounded border border-bastion-crimson/50 px-1 text-sm text-bastion-crimson hover:bg-bastion-crimson hover:text-bastion-parchment transition-colors"
        >
          −
        </button>
        <button
          type="button"
          onClick={() => adjustDomainRenown(1, 'quick')}
          aria-label="Raise renown by 1"
          title="+1"
          className="rounded border border-bastion-gold/60 px-1 text-sm text-bastion-gold-bright hover:bg-bastion-gold/30 transition-colors"
        >
          +
        </button>
      </span>
    </span>
  )
}

function StrongholdEditor() {
  const bastionId = useActiveBastionId()
  const bastion = useBastion(bastionId).data?.state
  const { levelUpStronghold } = useBastionMutation(bastionId)
  const aspect = bastion?.aspect
  const level = bastion?.strongholdLevel ?? 1
  const treasury = bastion?.treasury ?? 0
  const isPlayer = usePlayerView()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [open])

  if (!aspect) return null

  if (isPlayer) {
    return <span className="text-bastion-parchment">L{level}</span>
  }

  const quote = quoteNextUpgrade(aspect, level)
  const isMax = quote === null
  const canAfford = !isMax && treasury >= quote.cost.gp

  const handleUpgrade = () => {
    const result = levelUpStronghold()
    if (result.ok) {
      setError(null)
      setOpen(false)
    } else {
      setError(result.reason)
    }
  }

  return (
    <span ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v)
          setError(null)
        }}
        title={
          isMax
            ? 'Stronghold is at the highest level (5).'
            : `Click to upgrade — L${quote.fromLevel} → L${quote.toLevel} for ${quote.cost.gp} gp.`
        }
        aria-haspopup="menu"
        aria-expanded={open}
        className={[
          'transition-colors decoration-bastion-gold/40 underline-offset-4 hover:underline',
          isMax
            ? 'text-bastion-parchment cursor-default hover:no-underline'
            : 'text-bastion-parchment hover:text-bastion-gold-bright',
        ].join(' ')}
      >
        L{level}{!isMax && <span className="ml-1 text-base text-bastion-gold-bright">↑</span>}
      </button>

      {open && quote && (
        <div
          role="menu"
          className="parchment-surface absolute z-30 right-0 mt-2 w-80 rounded-md border-[3px] border-bastion-oak shadow-[3px_4px_0_rgba(0,0,0,0.5)] p-3 text-bastion-ink"
        >
          <div className="text-sm uppercase tracking-[0.22em] text-bastion-oak font-bold mb-2">
            Upgrade stronghold
          </div>
          <div className="font-display text-2xl text-bastion-ink mb-1">
            L{quote.fromLevel} → L{quote.toLevel}
          </div>
          <div className="text-base text-bastion-ink-soft mb-2">
            <span className="capitalize font-semibold">
              {quote.strongholdClass}
            </span>{' '}
            · {ASPECT_INFO[aspect].strongholdType}
          </div>
          <ul className="text-base text-bastion-ink space-y-0.5 mb-3">
            <li>
              <span className="uppercase tracking-[0.16em] text-bastion-oak mr-1">
                Cost:
              </span>
              <span className="font-semibold tabular-nums">
                {formatGp(quote.cost.gp)}
              </span>
              <span className="text-bastion-ink-mute"> · ~{quote.cost.days} days</span>
            </li>
            <li>
              <span className="uppercase tracking-[0.16em] text-bastion-oak mr-1">
                Treasury:
              </span>
              <span className={treasury < quote.cost.gp ? 'text-bastion-crimson font-semibold' : ''}>
                {formatGp(treasury)}
              </span>
              {treasury < quote.cost.gp && (
                <span className="text-bastion-crimson italic">
                  {' '}
                  ({formatGp(quote.cost.gp - treasury)} short)
                </span>
              )}
            </li>
          </ul>
          <p className="text-sm italic text-bastion-ink-mute mb-3 leading-relaxed">
            On upgrade you may also roll on the {aspect} class follower table
            (S&amp;F ch. 7) — add the result via the Followers section.
          </p>
          {error && (
            <div className="mb-2 rounded border-2 border-bastion-crimson bg-bastion-crimson/10 px-2 py-1 text-base text-bastion-crimson font-semibold">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded border border-bastion-oak px-3 py-1 text-base uppercase tracking-wider text-bastion-ink-soft hover:text-bastion-ink hover:bg-bastion-parchment-warm transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpgrade}
              disabled={!canAfford}
              className="banner-ribbon rounded px-3 py-1 text-base font-display tracking-[0.08em] uppercase hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Begin upgrade
            </button>
          </div>
        </div>
      )}
    </span>
  )
}

function Stat({ label, value, tone = 'default' }: StatProps) {
  return (
    <div className="flex flex-col">
      <span className="text-sm uppercase tracking-[0.25em] text-bastion-parchment/70">
        {label}
      </span>
      <span className={`mt-1 text-2xl font-semibold ${toneClass[tone]}`}>
        {value}
      </span>
    </div>
  )
}

export function HeaderStrip() {
  const bastionId = useActiveBastionId()
  const result = useBastion(bastionId)
  const bastion = result.data?.state
  const historyLength = result.data?.historyLength ?? 0
  const { advanceWeek, rewindWeek } = useBastionMutation(bastionId)
  const isPlayer = usePlayerView()

  if (!bastion) {
    return (
      <header className="sticky top-0 z-10 backdrop-blur-md bg-bastion-night/90 border-b-[3px] border-bastion-gold/70 shadow-[0_4px_0_-1px_var(--color-bastion-crimson-deep)]">
        <div className="max-w-6xl mx-auto px-6 py-5 text-bastion-parchment/70 italic">
          Loading bastion…
        </div>
      </header>
    )
  }

  const canRewind = historyLength > 0
  const pendingOrderCount = bastion.facilities.filter((f) => f.pendingOrder).length
  const constructionCount = bastion.facilities.filter(
    (f) => f.state === 'under-construction',
  ).length

  const invested = totalInvested(bastion.facilities)
  const specialUsed = bastion.facilities.filter((f) => f.class === 'special').length
  const specialMax = specialSlotsTotal(bastion.strongholdLevel)
  const intrigueAge = weeksSinceIntrigue(
    bastion.inGameWeek,
    bastion.domain.lastIntrigueEndedWeek,
  )
  const weeklyBreakdown = computeWeeklyTotal(bastion)
  const weeklyTotal = weeklyBreakdown.total
  const nextWouldGoNegative = bastion.treasury - weeklyTotal < 0

  return (
    <header className="sticky top-0 z-10 backdrop-blur-md bg-bastion-night/90 border-b-[3px] border-bastion-gold/70 shadow-[0_4px_0_-1px_var(--color-bastion-crimson-deep)]">
      <div className="max-w-6xl mx-auto px-6 py-5">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <BastionSwitcher />
            <div className="text-base text-bastion-parchment/80 mt-1 italic">
              {formatWeeksSinceIntrigue(intrigueAge)}
            </div>
          </div>
          <div className="flex items-end gap-4">
            <div className="text-right">
              <div className="text-sm uppercase tracking-[0.25em] text-bastion-parchment/70">
                In-game
              </div>
              <div className="text-2xl font-semibold text-bastion-parchment">
                Week {bastion.inGameWeek}
              </div>
            </div>
            {!isPlayer && (
              <div className="flex items-stretch gap-1">
                <button
                  type="button"
                  onClick={rewindWeek}
                  disabled={!canRewind}
                  title={
                    canRewind
                      ? 'Undo the last advance (up to 10 steps back).'
                      : 'No prior week to rewind to.'
                  }
                  className="rounded-md border-2 border-bastion-gold/60 bg-bastion-night/55 px-2 py-2 text-base font-display tracking-[0.06em] uppercase text-bastion-parchment hover:border-bastion-gold-bright hover:text-bastion-gold-bright transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Back
                </button>
                <div className="flex flex-col items-end gap-1">
                  <button
                    type="button"
                    onClick={advanceWeek}
                    title={
                      pendingOrderCount + constructionCount === 0
                        ? 'No pending orders or construction this week.'
                        : `${pendingOrderCount} order${pendingOrderCount === 1 ? '' : 's'}, ${constructionCount} build${constructionCount === 1 ? '' : 's'}`
                    }
                    className="banner-ribbon rounded-md px-4 py-2 text-lg font-display tracking-[0.08em] uppercase hover:brightness-110 active:translate-y-[1px] transition-all focus:outline-none focus:ring-2 focus:ring-bastion-gold-bright"
                  >
                    Advance week →
                  </button>
                  {weeklyTotal > 0 && (
                    <span
                      className={[
                        'text-sm uppercase tracking-[0.18em] font-semibold',
                        nextWouldGoNegative
                          ? 'text-bastion-crimson'
                          : 'text-bastion-parchment/85',
                      ].join(' ')}
                    >
                      next tick: {nextWouldGoNegative ? '⚠ ' : ''}−{weeklyTotal} gp
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-stretch gap-x-2 gap-y-3">
          {/* Identity cluster */}
          <div className="flex items-stretch gap-x-6 rounded-md bg-bastion-stone/40 px-4 py-2 ring-1 ring-bastion-gold/20">
            <Stat label="Aspect" value={<AspectEditor />} tone="gold" />
            <Stat label="Stronghold" value={<StrongholdEditor />} />
          </div>

          {/* Economy cluster */}
          <div className="flex items-stretch gap-x-6 rounded-md bg-bastion-stone/40 px-4 py-2 ring-1 ring-bastion-gold/20">
            <Stat label="Treasury" value={<TreasuryEditor value={bastion.treasury} />} />
            <Stat label="Invested" value={formatGp(invested)} tone="muted" />
          </div>

          {/* Capacity cluster */}
          <div className="flex items-stretch gap-x-6 rounded-md bg-bastion-stone/40 px-4 py-2 ring-1 ring-bastion-gold/20">
            <Stat
              label="Special slots"
              value={
                <span>
                  {specialUsed}
                  <span className="text-bastion-parchment/60"> / {specialMax}</span>
                </span>
              }
              tone="azure"
            />
            <Stat label="Renown" tone="crimson" value={<RenownEditor />} />
          </div>
        </div>
      </div>
    </header>
  )
}
