import { useEffect, useState } from 'react'
import type {
  Facility,
  FacilityFloor,
  FacilityState,
  Hireling,
  HirelingLoyalty,
  OrderType,
} from '../types'
import { useBastionStore } from '../store/useBastionStore'
import { formatGp } from '../lib/format'
import { getFloorLabel, getFloorOrder } from '../lib/floors'
import { usePlayerView } from '../lib/view-mode'
import { ASPECT_INFO } from '../data/aspect-info'
import { FacilityEditForm } from './FacilityEditForm'

const stateLabel: Record<FacilityState, string> = {
  active: 'Active',
  damaged: 'Damaged',
  disabled: 'Disabled',
  'under-construction': 'Under construction',
}

const stateTone: Record<FacilityState, string> = {
  active: 'border-bastion-verdant text-bastion-verdant bg-bastion-verdant/10',
  damaged: 'border-bastion-crimson text-bastion-crimson bg-bastion-crimson/10',
  disabled: 'border-bastion-ink-mute text-bastion-ink-mute bg-bastion-ink-mute/10',
  'under-construction':
    'border-bastion-ember text-bastion-ember bg-bastion-ember/10 border-dashed',
}

const loyaltyTone: Record<HirelingLoyalty, string> = {
  loyal: 'text-bastion-verdant',
  wavering: 'text-bastion-gold-deep',
  bribed: 'text-bastion-crimson',
  lost: 'text-bastion-ink-mute',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-sm uppercase tracking-[0.2em] text-bastion-oak font-semibold">
        {label}
      </div>
      <div className="mt-1 text-lg text-bastion-ink">{children}</div>
    </div>
  )
}

interface OrderPickerProps {
  facility: Facility
}

function OrderPicker({ facility }: OrderPickerProps) {
  const setOrder = useBastionStore((s) => s.setOrder)
  const week = useBastionStore((s) => s.bastions[s.activeBastionId].inGameWeek)
  const isPlayer = usePlayerView()
  const isActive = facility.state === 'active'
  const groupName = `order-${facility.id}`

  const choose = (value: OrderType | null) => {
    if (!isActive) return
    setOrder(facility.id, value)
  }

  if (isPlayer) {
    return (
      <Field label={`Order — week ${week}`}>
        {facility.pendingOrder ? (
          <span className="banner-ribbon rounded px-2 py-0.5 inline-block text-base tracking-wider">
            ▸ {facility.pendingOrder}
          </span>
        ) : (
          <span className="text-bastion-ink-mute italic">No order this week.</span>
        )}
      </Field>
    )
  }

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div className="text-sm uppercase tracking-[0.2em] text-bastion-oak font-semibold">
          Order — week {week}
        </div>
        {!isActive && (
          <span className="text-sm uppercase tracking-[0.18em] text-bastion-crimson">
            Locked · {facility.state}
          </span>
        )}
      </div>
      <fieldset
        className="mt-2 space-y-1.5"
        disabled={!isActive}
        aria-label={`Choose this week's order for ${facility.name}`}
      >
        <OrderRadio
          name={groupName}
          label="No order this week"
          checked={!facility.pendingOrder}
          onChange={() => choose(null)}
          muted
        />
        {facility.orders.map((order) => (
          <OrderRadio
            key={order}
            name={groupName}
            label={order}
            checked={facility.pendingOrder === order}
            onChange={() => choose(order)}
          />
        ))}
      </fieldset>
    </div>
  )
}

interface OrderRadioProps {
  name: string
  label: string
  checked: boolean
  onChange: () => void
  muted?: boolean
}

function OrderRadio({ name, label, checked, onChange, muted }: OrderRadioProps) {
  // "No order" (muted) gets a neutral oak/parchment style even when checked —
  // crimson banner is reserved for actual order selections so the panel never
  // reads as "in danger" in its default state.
  const checkedClass = muted
    ? 'border-bastion-oak bg-bastion-parchment-warm text-bastion-ink shadow-[1px_2px_0_rgba(0,0,0,0.2)]'
    : 'banner-ribbon shadow-[1px_2px_0_rgba(0,0,0,0.4)]'

  return (
    <label
      className={[
        'flex items-center gap-2 rounded-md border-2 px-3 py-1.5 text-lg cursor-pointer transition-all font-serif',
        checked
          ? checkedClass
          : 'border-bastion-oak/60 bg-bastion-parchment-warm/40 text-bastion-ink hover:border-bastion-crimson hover:bg-bastion-crimson/5',
        muted && !checked ? 'italic text-bastion-ink-mute' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="accent-bastion-crimson"
      />
      <span>{label}</span>
    </label>
  )
}

function PanelEmpty() {
  return (
    <div className="text-lg text-bastion-ink-soft italic font-serif">
      Select a facility on the floor plan to inspect its orders, hireling, and history.
    </div>
  )
}

interface PanelBodyProps {
  facility: Facility
  hireling: Hireling | undefined
}

function PanelBody({ facility, hireling }: PanelBodyProps) {
  const isSpecial = facility.class === 'special'
  const totalCost = facility.cost * (facility.count ?? 1)
  const isUnderConstruction = facility.state === 'under-construction'
  const isPlayer = usePlayerView()
  const removeFacility = useBastionStore((s) => s.removeFacility)
  const [editing, setEditing] = useState(false)

  const handleDelete = () => {
    if (
      window.confirm(
        `Demolish ${facility.name}? This is irreversible. The room will be removed from the floor plan; any linked hireling will also be dropped.`,
      )
    ) {
      removeFacility(facility.id)
    }
  }

  return (
    <div className="space-y-5">
      <div className="banner-ribbon -mx-5 -mt-5 px-5 py-3 flex items-baseline justify-between gap-3">
        <h3 className="font-display text-2xl tracking-[0.05em] flex items-center gap-2">
          {isSpecial && (
            <span className="heraldic-crest text-lg" aria-hidden>
              ★
            </span>
          )}
          {facility.name}
        </h3>
        {facility.count && facility.count > 1 ? (
          <span className="text-base tracking-wider text-bastion-parchment/80">
            ×{facility.count}
          </span>
        ) : null}
      </div>

      {editing && !isPlayer && (
        <FacilityEditForm
          facility={facility}
          onClose={() => setEditing(false)}
        />
      )}

      <div className="text-base uppercase tracking-[0.2em] text-bastion-ink-soft font-semibold">
        {facility.class} · {facility.size}
        {facility.tierUnlock ? ` · tier ${facility.tierUnlock}` : ''}
      </div>

      <span
        className={`inline-block rounded border-2 px-2 py-0.5 text-base uppercase tracking-[0.18em] font-semibold ${
          stateTone[facility.state]
        }`}
      >
        {stateLabel[facility.state]}
        {isUnderConstruction && facility.daysRemaining != null
          ? ` · ${facility.daysRemaining}d left`
          : ''}
      </span>

      <div className="grid grid-cols-2 gap-4">
        <Field label={facility.count && facility.count > 1 ? 'Cost (each)' : 'Cost'}>
          {formatGp(facility.cost)}
        </Field>
        {facility.count && facility.count > 1 ? (
          <Field label="Cost (total)">{formatGp(totalCost)}</Field>
        ) : (
          <Field label="Build time">{facility.buildTimeDays} days</Field>
        )}
        {facility.count && facility.count > 1 ? (
          <Field label="Build time">{facility.buildTimeDays} days</Field>
        ) : null}
      </div>

      <Field label="Hireling">
        {hireling ? (
          <div className="space-y-0.5">
            <div>
              <span className="font-semibold">{hireling.name}</span>
              <span className="text-bastion-ink-soft"> — {hireling.role}</span>
            </div>
            <div className="text-base">
              <span className={`font-semibold ${loyaltyTone[hireling.loyalty]}`}>
                {hireling.loyalty}
              </span>
              <span className="text-bastion-ink-mute">
                {' · '}
                {formatGp(hireling.salaryGp)}/wk
              </span>
            </div>
          </div>
        ) : (
          <span className="text-bastion-ink-mute italic">None assigned</span>
        )}
      </Field>

      {facility.orders.length === 0 ? (
        <Field label="Orders">
          <span className="text-bastion-ink-mute italic">
            No orders — basic facilities provide passive benefits only.
          </span>
        </Field>
      ) : (
        <OrderPicker facility={facility} />
      )}

      {facility.domainSkillBoosts && facility.domainSkillBoosts.length > 0 && (
        <Field label="Domain boosts">
          <ul className="space-y-0.5 text-base">
            {facility.domainSkillBoosts.map((boost) => (
              <li key={boost.skill} className="text-bastion-ink">
                <span className="text-bastion-azure font-bold">+{boost.amount}</span>{' '}
                <span className="capitalize">{boost.skill}</span>
              </li>
            ))}
          </ul>
        </Field>
      )}

      {facility.notes && (
        <Field label="Notes">
          <p className="text-base leading-relaxed text-bastion-ink-soft italic">
            {facility.notes}
          </p>
        </Field>
      )}

      <FloorPicker facility={facility} />

      {!isPlayer && !editing && (
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded border-2 border-bastion-azure px-3 py-1 text-base uppercase tracking-wider text-bastion-azure hover:bg-bastion-azure/10 transition-colors focus:outline-none focus:ring-2 focus:ring-bastion-azure"
          >
            Edit room
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded border-2 border-bastion-crimson px-3 py-1 text-base uppercase tracking-wider text-bastion-crimson hover:bg-bastion-crimson hover:text-bastion-parchment transition-colors focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
          >
            Demolish
          </button>
        </div>
      )}

      <FacilityHistory facilityId={facility.id} />
    </div>
  )
}


function FloorPicker({ facility }: { facility: Facility }) {
  const setFacilityFloor = useBastionStore((s) => s.setFacilityFloor)
  const bastion = useBastionStore((s) => s.bastions[s.activeBastionId])
  const isPlayer = usePlayerView()
  const current = facility.floor ?? 'ground'
  const orderedFloors = getFloorOrder(bastion)

  return (
    <Field label="Floor">
      {isPlayer ? (
        <span className="text-bastion-ink">{getFloorLabel(bastion, current)}</span>
      ) : (
        <select
          value={current}
          onChange={(e) =>
            setFacilityFloor(facility.id, e.target.value as FacilityFloor)
          }
          aria-label="Move to floor"
          className="rounded border border-bastion-oak bg-bastion-parchment-warm px-2 py-1 text-lg text-bastion-ink focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
        >
          {orderedFloors.map((f) => (
            <option key={f} value={f}>
              {getFloorLabel(bastion, f)}
            </option>
          ))}
        </select>
      )}
    </Field>
  )
}

function FacilityHistory({ facilityId }: { facilityId: string }) {
  const log = useBastionStore((s) => s.bastions[s.activeBastionId].log)
  const recent = log.filter((e) => e.actor === facilityId).slice(-5).reverse()

  // Empty state: a single muted line, not a full Field block.
  if (recent.length === 0) {
    return (
      <p className="text-base text-bastion-ink-mute italic">
        <span className="uppercase tracking-[0.18em] text-bastion-oak/70 not-italic font-semibold mr-2">
          History
        </span>
        no entries yet.
      </p>
    )
  }

  return (
    <Field label="History">
      <ul className="space-y-1.5 text-base text-bastion-ink">
        {recent.map((entry) => (
          <li key={entry.id} className="flex gap-2 border-l-2 border-bastion-oak/60 pl-2">
            <span className="text-bastion-oak font-bold tabular-nums">
              W{entry.week}
            </span>
            <span>{entry.outcome}</span>
          </li>
        ))}
      </ul>
    </Field>
  )
}

function AccordionSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded border border-bastion-oak/40 bg-bastion-parchment-warm/40 overflow-hidden"
    >
      <summary className="flex items-center justify-between gap-2 px-3 py-2 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
        <span className="text-base uppercase tracking-[0.22em] text-bastion-oak font-bold">
          {title}
        </span>
        <span className="text-bastion-oak transition-transform group-open:rotate-180" aria-hidden>
          ▾
        </span>
      </summary>
      <div className="px-3 pb-3 pt-1">{children}</div>
    </details>
  )
}

function ActionCard({ action, index }: { action: string; index: number }) {
  return (
    <div className="rounded border-2 border-bastion-crimson/60 bg-bastion-parchment-warm/70 p-2 shadow-[1px_2px_0_rgba(0,0,0,0.3)]">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-sm uppercase tracking-[0.18em] text-bastion-crimson font-bold">
          Action {index + 1}
        </span>
        <span className="text-sm uppercase tracking-[0.16em] text-bastion-ink-mute">
          init 20
        </span>
      </div>
      <p className="text-base text-bastion-ink leading-relaxed">{action}</p>
    </div>
  )
}

function AspectTab() {
  const aspect = useBastionStore((s) => s.bastions[s.activeBastionId].aspect)
  const pending = useBastionStore((s) => s.bastions[s.activeBastionId].pendingAspect)
  const info = ASPECT_INFO[aspect]

  return (
    <div className="space-y-4">
      <div className="banner-ribbon -mx-5 -mt-5 px-5 py-3 flex items-baseline justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl tracking-[0.05em]">{aspect}</h3>
          <div className="text-base uppercase tracking-[0.2em] text-bastion-parchment/80 mt-0.5">
            {info.strongholdType}
          </div>
        </div>
        <span className="text-sm uppercase tracking-[0.18em] text-bastion-parchment/80">
          Aspect
        </span>
      </div>

      {pending && (
        <div className="rounded border-2 border-bastion-ember bg-bastion-ember/10 px-3 py-2 text-base text-bastion-ink">
          <span className="font-semibold">Switching to {pending.aspect}.</span>{' '}
          Resolves on next advance · 500 gp held in escrow.
        </div>
      )}

      {info.homebrew && (
        <div className="rounded border border-bastion-ember/60 bg-bastion-ember/10 px-2 py-1 text-base uppercase tracking-[0.18em] text-bastion-ember">
          Homebrew · not in S&F
        </div>
      )}

      <p className="text-lg italic text-bastion-ink-soft leading-relaxed border-l-2 border-bastion-gold/50 pl-3">
        {info.flavour}
      </p>

      {/* Stronghold Actions: highest-utility, expanded by default, action-card style. */}
      <section>
        <div className="flex items-baseline justify-between mb-2">
          <h4 className="font-display text-lg font-bold uppercase tracking-[0.18em] text-bastion-ink">
            Stronghold actions
          </h4>
          <span className="text-sm uppercase tracking-[0.16em] text-bastion-ink-mute">
            no repeats / short rest
          </span>
        </div>
        <div className="space-y-2">
          {info.strongholdActions.map((action, i) => (
            <ActionCard key={i} action={action} index={i} />
          ))}
        </div>
      </section>

      <AccordionSection title="Demesne effects">
        <p className="text-base text-bastion-ink-mute italic mb-1.5">
          GM picks one or more at their discretion.
        </p>
        <ul className="space-y-1.5 text-base text-bastion-ink leading-relaxed">
          {info.demesneEffects.map((effect, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-bastion-oak font-bold mt-0.5">◆</span>
              <span>{effect}</span>
            </li>
          ))}
        </ul>
      </AccordionSection>

      <AccordionSection title={`Class feature — ${info.classFeature.name}`}>
        <p className="text-base text-bastion-ink leading-relaxed">
          {info.classFeature.summary}
        </p>
      </AccordionSection>

      <AccordionSection title="Followers">
        <p className="text-lg text-bastion-ink leading-relaxed">{info.followers}</p>
      </AccordionSection>

      <AccordionSection title="Switching cost">
        <p className="text-base text-bastion-ink-soft italic leading-relaxed">
          500 gp + 1 in-game week of downtime, no roll. Followers earned under the
          prior Aspect remain — they are loyal to people, not to the building.
        </p>
      </AccordionSection>
    </div>
  )
}

type PanelTab = 'facility' | 'aspect'

export function FacilityPanel() {
  const selectedId = useBastionStore((s) => s.selectedFacilityId)
  const facility = useBastionStore((s) =>
    selectedId ? s.bastions[s.activeBastionId].facilities.find((f) => f.id === selectedId) : undefined,
  )
  const hireling = useBastionStore((s) =>
    facility?.hirelingId
      ? s.bastions[s.activeBastionId].hirelings.find((h) => h.id === facility.hirelingId)
      : undefined,
  )
  const clearSelection = useBastionStore((s) => s.clearSelection)

  const [tab, setTab] = useState<PanelTab>('aspect')

  // Selecting a facility auto-flips to the Facility tab so the click is honored.
  useEffect(() => {
    if (selectedId) setTab('facility')
  }, [selectedId])

  const showFacility = tab === 'facility'
  const isExpanded = showFacility && !!facility

  return (
    <aside
      aria-label="Details"
      className={[
        'parchment-surface rounded-md border-[3px] border-bastion-oak p-5 shadow-[3px_4px_0_rgba(0,0,0,0.5)]',
        'lg:sticky lg:top-[12.5rem]',
        isExpanded ? 'lg:max-h-[calc(100vh-14rem)] lg:overflow-y-auto' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex gap-1" role="tablist" aria-label="Details view">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'facility'}
            onClick={() => setTab('facility')}
            className={[
              'rounded border px-2 py-0.5 text-sm uppercase tracking-[0.2em] font-bold transition-colors',
              tab === 'facility'
                ? 'border-bastion-oak bg-bastion-oak text-bastion-parchment'
                : 'border-bastion-oak/50 text-bastion-oak hover:bg-bastion-parchment-warm',
            ].join(' ')}
          >
            Facility
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'aspect'}
            onClick={() => setTab('aspect')}
            className={[
              'rounded border px-2 py-0.5 text-sm uppercase tracking-[0.2em] font-bold transition-colors',
              tab === 'aspect'
                ? 'border-bastion-oak bg-bastion-oak text-bastion-parchment'
                : 'border-bastion-oak/50 text-bastion-oak hover:bg-bastion-parchment-warm',
            ].join(' ')}
          >
            Aspect
          </button>
        </div>
        {showFacility && facility && (
          <button
            type="button"
            onClick={clearSelection}
            className="text-base text-bastion-ink-soft hover:text-bastion-crimson transition-colors"
            aria-label="Close facility details"
          >
            close ×
          </button>
        )}
      </div>

      {tab === 'aspect' ? (
        <AspectTab />
      ) : facility ? (
        <PanelBody facility={facility} hireling={hireling} />
      ) : (
        <PanelEmpty />
      )}
    </aside>
  )
}
