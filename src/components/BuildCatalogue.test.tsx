import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BuildCatalogue } from './BuildCatalogue'
import { useBastionDataStore } from '../store/useBastionDataStore'
import { useUiStore } from '../store/useUiStore'
import { seedManor } from '../data/seed'

function resetStoreWithTreasury(gp: number) {
  useBastionDataStore.setState((s) => {
    const id = s.activeBastionId
    return {
      bastions: { ...s.bastions, [id]: { ...seedManor(), treasury: gp } },
      weekHistory: [],
    }
  })
  useUiStore.setState({ selectedFacilityId: null, viewMode: 'dm' })
}

function getActive() {
  const s = useBastionDataStore.getState()
  return s.bastions[s.activeBastionId]
}

describe('<BuildCatalogue />', () => {
  beforeEach(() => {
    resetStoreWithTreasury(5_000)
  })

  it('opens the catalogue panel on click', async () => {
    render(<BuildCatalogue />)
    expect(screen.queryByText(/Bedroom/i)).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: /Build new facility/i }))
    expect(screen.getByText(/Bedroom/i)).toBeTruthy()
    expect(screen.getByText(/Storage/i)).toBeTruthy()
  })

  it('clicking a size button starts a build, deducting treasury and adding the facility', async () => {
    render(<BuildCatalogue />)
    await userEvent.click(screen.getByRole('button', { name: /Build new facility/i }))

    const before = getActive()
    expect(before.facilities.find((f) => f.name === 'Kitchen' && f.state === 'under-construction')).toBeUndefined()

    // The Kitchen "Roomy" button — there are multiple "Roomy" buttons across
    // the catalogue, so scope by title content.
    const roomyButtons = screen.getAllByTitle(/Build Kitchen \(Roomy\)/i)
    expect(roomyButtons.length).toBeGreaterThan(0)
    await userEvent.click(roomyButtons[0])

    const after = getActive()
    expect(after.treasury).toBe(5_000 - 1_000)
    const built = after.facilities.find(
      (f) => f.name === 'Kitchen' && f.state === 'under-construction',
    )
    expect(built).toBeDefined()
    expect(built?.size).toBe('roomy')
    expect(built?.daysRemaining).toBe(45)
  })

  it('disables the Cramped button when the user is short on treasury', async () => {
    resetStoreWithTreasury(100)
    render(<BuildCatalogue />)
    await userEvent.click(screen.getByRole('button', { name: /Build new facility/i }))

    // Bedroom Cramped costs 500 gp.
    const crampedButtons = screen.getAllByTitle(/Need .+ more in treasury/i)
    expect(crampedButtons.length).toBeGreaterThan(0)
    expect((crampedButtons[0] as HTMLButtonElement).disabled).toBe(true)
  })
})
