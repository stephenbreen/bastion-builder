'use client';
import { useBastionStore } from '../store/useBastionStore'
import { computeDomainSkills } from '../lib/domain'
import { formatWeeksSinceIntrigue, weeksSinceIntrigue } from '../lib/format'
import { usePlayerView } from '../lib/view-mode'
import {
  DOMAIN_DEFENSES,
  DOMAIN_DEFENSE_MAX,
  DOMAIN_DEFENSE_MIN,
  DOMAIN_SKILLS,
  type DomainDefense,
  type DomainSkill,
} from '../types'

const skillTone: Record<DomainSkill, string> = {
  diplomacy: 'text-bastion-gold-bright',
  espionage: 'text-bastion-crimson',
  lore: 'text-bastion-azure',
  operations: 'text-bastion-verdant',
}

function skillLabel(s: DomainSkill): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function defenseLabel(d: DomainDefense): string {
  return d.charAt(0).toUpperCase() + d.slice(1)
}

function defenseTone(value: number): string {
  if (value > 0) return 'text-bastion-verdant'
  if (value < 0) return 'text-bastion-crimson'
  return 'text-bastion-ink'
}

export function DomainSection() {
  const domain = useBastionStore((s) => s.bastions[s.activeBastionId].domain)
  const week = useBastionStore((s) => s.bastions[s.activeBastionId].inGameWeek)
  const facilities = useBastionStore((s) => s.bastions[s.activeBastionId].facilities)
  const setDomainSize = useBastionStore((s) => s.setDomainSize)
  const adjustDomainDefense = useBastionStore((s) => s.adjustDomainDefense)
  const beginIntrigue = useBastionStore((s) => s.beginIntrigue)
  const endIntrigue = useBastionStore((s) => s.endIntrigue)
  const isPlayer = usePlayerView()

  const breakdowns = computeDomainSkills(domain, facilities)
  const intrigueDuration = 4 + domain.size
  const sinceIntrigue = formatWeeksSinceIntrigue(
    weeksSinceIntrigue(week, domain.lastIntrigueEndedWeek),
  )

  return (
    <section className="mt-8">
      <div className="flex items-baseline justify-between mb-3 flex-wrap gap-3">
        <h2 className="text-4xl font-bold heading-display font-display tracking-[0.06em]">
          Domain
        </h2>
        <span className="text-base uppercase tracking-[0.18em] text-page-muted-strong">
          K&amp;W layer
        </span>
      </div>

      <div className="parchment-surface rounded-md border-[3px] border-bastion-oak p-4 shadow-[3px_4px_0_rgba(0,0,0,0.5)] grid gap-5 md:grid-cols-3">
        <div>
          <div className="text-sm uppercase tracking-[0.2em] text-bastion-oak font-semibold mb-1">
            Domain size
          </div>
          <div className="flex items-center gap-2">
            {!isPlayer && (
              <button
                type="button"
                onClick={() => setDomainSize(domain.size - 1)}
                disabled={domain.size <= 1}
                aria-label="Lower domain size"
                className="rounded border border-bastion-crimson/60 px-1.5 text-bastion-crimson hover:bg-bastion-crimson hover:text-bastion-parchment transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                −
              </button>
            )}
            <span className="text-4xl font-display text-bastion-ink tabular-nums">
              {domain.size}
            </span>
            {!isPlayer && (
              <button
                type="button"
                onClick={() => setDomainSize(domain.size + 1)}
                disabled={domain.size >= 5}
                aria-label="Raise domain size"
                className="rounded border border-bastion-gold/60 px-1.5 text-bastion-gold-deep hover:bg-bastion-gold/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                +
              </button>
            )}
            <span className="text-base text-bastion-ink-mute">/ 5</span>
          </div>
          <p className="mt-2 text-base text-bastion-ink-mute italic">
            Intrigue lasts 4 + size turns.
          </p>
        </div>

        <div className="md:col-span-2">
          <div className="text-sm uppercase tracking-[0.2em] text-bastion-oak font-semibold mb-1">
            Domain skills
          </div>
          <ul className="grid grid-cols-2 gap-2">
            {DOMAIN_SKILLS.map((skill) => {
              const b = breakdowns[skill]
              const tooltip = b.contributions.length
                ? `Base ${b.base} + ${b.contributions
                    .map((c) => `${c.source} +${c.amount}`)
                    .join(', ')}${b.capApplied ? ' (capped at +5)' : ''}`
                : 'No active facilities boost this skill yet.'
              return (
                <li
                  key={skill}
                  title={tooltip}
                  className="flex items-baseline justify-between rounded border border-bastion-oak/60 bg-bastion-parchment-warm/50 px-2 py-1"
                >
                  <span className="text-lg text-bastion-ink">{skillLabel(skill)}</span>
                  <span
                    className={`text-2xl font-display font-semibold tabular-nums ${skillTone[skill]}`}
                  >
                    +{b.total}
                    {b.capApplied && (
                      <span className="ml-1 text-sm text-bastion-ink-mute">
                        (cap)
                      </span>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="md:col-span-3">
          <div className="text-sm uppercase tracking-[0.2em] text-bastion-oak font-semibold mb-1">
            Defenses
            <span className="ml-2 text-base normal-case tracking-normal text-bastion-ink-mute italic font-normal">
              (range −3..+3, drift toward 0 between intrigues)
            </span>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {DOMAIN_DEFENSES.map((defense) => {
              const value = domain.defenses[defense]
              return (
                <li
                  key={defense}
                  className="flex items-center justify-between rounded border border-bastion-oak/60 bg-bastion-parchment-warm/50 px-2 py-1.5"
                >
                  <span className="text-lg text-bastion-ink">{defenseLabel(defense)}</span>
                  <div className="flex items-center gap-2">
                    {!isPlayer && (
                      <button
                        type="button"
                        onClick={() => adjustDomainDefense(defense, -1)}
                        disabled={value <= DOMAIN_DEFENSE_MIN}
                        aria-label={`Lower ${defense}`}
                        className="rounded border border-bastion-crimson/60 px-1.5 text-bastion-crimson hover:bg-bastion-crimson hover:text-bastion-parchment transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        −
                      </button>
                    )}
                    <span
                      className={`text-xl font-display font-semibold tabular-nums w-7 text-center ${defenseTone(value)}`}
                    >
                      {value > 0 ? '+' : ''}
                      {value}
                    </span>
                    {!isPlayer && (
                      <button
                        type="button"
                        onClick={() => adjustDomainDefense(defense, 1)}
                        disabled={value >= DOMAIN_DEFENSE_MAX}
                        aria-label={`Raise ${defense}`}
                        className="rounded border border-bastion-gold/60 px-1.5 text-bastion-gold-deep hover:bg-bastion-gold/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="md:col-span-3">
          {domain.intrigueActive ? (
            <div className="banner-ribbon rounded-md px-4 py-3 flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-sm uppercase tracking-[0.25em] text-bastion-parchment/80">
                  Intrigue underway
                </div>
                <div className="font-display text-2xl tracking-[0.05em]">
                  {domain.intrigueTurnsRemaining} turn
                  {domain.intrigueTurnsRemaining === 1 ? '' : 's'} remaining
                </div>
              </div>
              {!isPlayer && (
                <button
                  type="button"
                  onClick={endIntrigue}
                  className="rounded border-2 border-bastion-gold bg-bastion-shadow/40 px-3 py-1.5 text-base font-display tracking-[0.08em] uppercase text-bastion-gold-bright hover:bg-bastion-shadow/20 transition-colors"
                >
                  End intrigue
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-md border-2 border-bastion-oak bg-bastion-parchment-warm/40 px-4 py-3 flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-sm uppercase tracking-[0.25em] text-bastion-oak font-semibold">
                  Intrigue
                </div>
                <div className="text-lg text-bastion-ink-soft italic">
                  {sinceIntrigue}. Begin will queue {intrigueDuration} turns (4 + size{' '}
                  {domain.size}).
                </div>
              </div>
              {!isPlayer && (
                <button
                  type="button"
                  onClick={beginIntrigue}
                  className="banner-ribbon rounded px-3 py-1.5 text-base font-display tracking-[0.08em] uppercase hover:brightness-110 transition-all"
                >
                  Begin intrigue
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
