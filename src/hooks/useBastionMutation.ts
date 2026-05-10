'use client';
import { useMemo } from 'react'
import type {
  Aspect,
  DomainDefense,
  FacilityFloor,
  OrderType,
  Size,
  WeeklyCostKey,
} from '../types'
import { useBastionDataStore } from '../store/useBastionDataStore'
import type { BuildResult } from '../store/reducers/build'
import type { SwitchAspectResult } from '../store/reducers/aspect'
import type {
  FollowerInput,
  FollowerPatch,
} from '../store/reducers/followers'
import type {
  ProjectInput,
  ProjectPatch,
  RollProjectInput,
  RollProjectResult,
} from '../store/reducers/projects'
import type {
  RecordActivityInput,
  RecordActivityResult,
} from '../store/reducers/activities'
import type {
  HomebrewDraft,
  HomebrewPatch,
  HomebrewResult,
} from '../store/reducers/homebrew-rooms'
import type { RemoveFloorResult } from '../store/reducers/floors'
import type {
  FacilityPatch,
  UpdateFacilityResult,
} from '../store/reducers/facility-edit'
import type {
  PCInput,
  PCPatch,
  PCResult,
} from '../store/reducers/pcs'
import type { LevelUpResult } from '../store/reducers/stronghold-level'

/**
 * Mutation API bound to a single bastion id. Phase B routes calls through the
 * in-memory `useBastionDataStore`; Unit 7 swaps the implementation for
 * PATCH-style mutations via TanStack Query without touching call sites.
 *
 * `bastionId` may be `undefined` while the active bastion is loading; in that
 * window every mutation is a silent no-op. Result-returning mutations resolve
 * against the active bastion (matching the data store's own fallback), so
 * the rare race where a button click lands during the brief unresolved
 * interval still applies to the right bastion.
 */
export function useBastionMutation(bastionId: string | undefined) {
  return useMemo(() => {
    // Resolves the id at call time so a late-arriving bastionId still works.
    // useBastionDataStore's actions tolerate an `''` id by no-opping.
    const resolveId = () =>
      bastionId ?? useBastionDataStore.getState().activeBastionId
    const a = () => useBastionDataStore.getState()

    return {
      setOrder: (facilityId: string, order: OrderType | null) =>
        a().setOrder(resolveId(), facilityId, order),
      setFacilityFloor: (facilityId: string, floor: FacilityFloor) =>
        a().setFacilityFloor(resolveId(), facilityId, floor),

      advanceWeek: () => a().advanceWeek(resolveId()),
      rewindWeek: (): boolean => a().rewindWeek(resolveId()),

      startBuild: (catalogueId: string, size: Size): BuildResult =>
        a().startBuild(resolveId(), catalogueId, size),

      setTreasury: (amount: number) => a().setTreasury(resolveId(), amount),
      switchAspect: (target: Aspect): SwitchAspectResult =>
        a().switchAspect(resolveId(), target),
      cancelAspectSwitch: () => a().cancelAspectSwitch(resolveId()),

      addFollower: (input: FollowerInput) =>
        a().addFollower(resolveId(), input),
      updateFollower: (followerId: string, patch: FollowerPatch) =>
        a().updateFollower(resolveId(), followerId, patch),
      removeFollower: (followerId: string) =>
        a().removeFollower(resolveId(), followerId),

      adjustDomainRenown: (delta: number, reason?: string) =>
        a().adjustDomainRenown(resolveId(), delta, reason),
      setDomainSize: (size: number) => a().setDomainSize(resolveId(), size),
      setDomainDefense: (defense: DomainDefense, value: number) =>
        a().setDomainDefense(resolveId(), defense, value),
      adjustDomainDefense: (defense: DomainDefense, delta: number) =>
        a().adjustDomainDefense(resolveId(), defense, delta),
      beginIntrigue: () => a().beginIntrigue(resolveId()),
      endIntrigue: () => a().endIntrigue(resolveId()),

      addProject: (input: ProjectInput) => a().addProject(resolveId(), input),
      updateProject: (projectId: string, patch: ProjectPatch) =>
        a().updateProject(resolveId(), projectId, patch),
      removeProject: (projectId: string) =>
        a().removeProject(resolveId(), projectId),
      rollProject: (
        projectId: string,
        input: RollProjectInput,
      ): RollProjectResult => a().rollProject(resolveId(), projectId, input),

      recordActivity: (input: RecordActivityInput): RecordActivityResult =>
        a().recordActivity(resolveId(), input),
      setDmNotes: (text: string) => a().setDmNotes(resolveId(), text),
      setWeeklyCost: (category: WeeklyCostKey, value: number) =>
        a().setWeeklyCost(resolveId(), category, value),
      setUpkeepNotes: (text: string) => a().setUpkeepNotes(resolveId(), text),

      addCustomCatalogueEntry: (draft: HomebrewDraft): HomebrewResult =>
        a().addCustomCatalogueEntry(resolveId(), draft),
      updateCustomCatalogueEntry: (
        entryId: string,
        patch: HomebrewPatch,
      ): HomebrewResult =>
        a().updateCustomCatalogueEntry(resolveId(), entryId, patch),
      removeCustomCatalogueEntry: (entryId: string) =>
        a().removeCustomCatalogueEntry(resolveId(), entryId),

      setFloorLabel: (floor: FacilityFloor, label: string) =>
        a().setFloorLabel(resolveId(), floor, label),
      moveFloor: (floor: FacilityFloor, direction: 'up' | 'down') =>
        a().moveFloor(resolveId(), floor, direction),
      addFloor: (label?: string): string => a().addFloor(resolveId(), label),
      removeFloor: (floor: FacilityFloor): RemoveFloorResult =>
        a().removeFloor(resolveId(), floor),
      resetFloors: () => a().resetFloors(resolveId()),

      updateFacility: (
        facilityId: string,
        patch: FacilityPatch,
      ): UpdateFacilityResult =>
        a().updateFacility(resolveId(), facilityId, patch),
      removeFacility: (facilityId: string) =>
        a().removeFacility(resolveId(), facilityId),

      addPc: (input: PCInput): PCResult => a().addPc(resolveId(), input),
      updatePc: (pcId: string, patch: PCPatch): PCResult =>
        a().updatePc(resolveId(), pcId, patch),
      removePc: (pcId: string) => a().removePc(resolveId(), pcId),

      levelUpStronghold: (): LevelUpResult =>
        a().levelUpStronghold(resolveId()),

      resetToSeed: () => a().reset(),
    }
  }, [bastionId])
}
