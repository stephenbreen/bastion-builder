import type {
  Bastion,
  Facility,
  FacilityFloor,
  Hireling,
  LogEntry,
  Size,
} from '../../types'
import {
  findCatalogueEntry,
  getSizeCost,
} from '../../data/facility-catalogue'
import { newId } from '../../lib/id'

export interface BuildOrder {
  catalogueId: string
  size: Size
  floor?: FacilityFloor
}

export type BuildResult =
  | { ok: true; bastion: Bastion; facilityId: string }
  | { ok: false; bastion: Bastion; reason: string }

export function startBuild(bastion: Bastion, order: BuildOrder): BuildResult {
  const entry = findCatalogueEntry(order.catalogueId, bastion.customCatalogueEntries)
  if (!entry) {
    return { ok: false, bastion, reason: `Unknown catalogue entry: ${order.catalogueId}` }
  }
  if (!entry.sizes.includes(order.size)) {
    return { ok: false, bastion, reason: `${entry.name} cannot be built ${order.size}` }
  }
  const { cost, days } = getSizeCost(entry, order.size)
  if (bastion.treasury < cost) {
    return {
      ok: false,
      bastion,
      reason: `Insufficient treasury (${bastion.treasury} < ${cost} gp)`,
    }
  }

  const facilityId = `${entry.id}-${newId().slice(0, 8)}`
  const orders = entry.orders ? [...entry.orders] : []

  // Auto-create a hireling when the entry asked for one (homebrew specials).
  let hirelings = bastion.hirelings
  let hirelingId: string | undefined
  if (entry.hirelingLabel) {
    hirelingId = `${facilityId}-h`
    const newHireling: Hireling = {
      id: hirelingId,
      name: entry.hirelingLabel,
      role: entry.hirelingLabel,
      facilityId,
      loyalty: 'loyal',
      salaryGp: 0,
    }
    hirelings = [...bastion.hirelings, newHireling]
  }

  const newFacility: Facility = {
    id: facilityId,
    name: entry.name,
    class: entry.class,
    size: order.size,
    cost,
    buildTimeDays: days,
    orders,
    state: 'under-construction',
    daysRemaining: days,
    floor: order.floor ?? 'ground',
    category: entry.category,
    ...(entry.tierUnlock ? { tierUnlock: entry.tierUnlock } : {}),
    ...(entry.domainSkillBoosts && entry.domainSkillBoosts.length > 0
      ? { domainSkillBoosts: entry.domainSkillBoosts }
      : {}),
    ...(hirelingId ? { hirelingId } : {}),
    ...(entry.notes ? { notes: entry.notes } : {}),
  }

  const log: LogEntry = {
    id: newId(),
    week: bastion.inGameWeek,
    actor: facilityId,
    type: 'construction',
    outcome: `Construction started: ${entry.name} (${order.size}, ${cost} gp · ${days} days).`,
    payload: {
      catalogueId: entry.id,
      size: order.size,
      cost,
      days,
      ...(entry.homebrew ? { homebrew: true } : {}),
    },
  }

  return {
    ok: true,
    facilityId,
    bastion: {
      ...bastion,
      treasury: bastion.treasury - cost,
      facilities: [...bastion.facilities, newFacility],
      hirelings,
      log: [...bastion.log, log],
    },
  }
}
