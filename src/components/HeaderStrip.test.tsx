import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HeaderStrip } from './HeaderStrip'
import { useBastionStore } from '../store/useBastionStore'
import { seedManor } from '../data/seed'

function resetStoreToSeed() {
  // Replace the active bastion with a fresh seed (drops localStorage state
  // for purposes of this test run — the persist middleware reads at startup).
  useBastionStore.setState((s) => {
    const id = s.activeBastionId
    return {
      bastions: { ...s.bastions, [id]: seedManor() },
      selectedFacilityId: null,
      weekHistory: [],
      viewMode: 'dm',
    }
  })
}

describe('<HeaderStrip /> — advance week button', () => {
  beforeEach(() => {
    resetStoreToSeed()
  })

  it('renders the current in-game week', () => {
    render(<HeaderStrip />)
    expect(screen.getByText(/^Week 1$/)).toBeTruthy()
  })

  it('clicking Advance Week resolves a pending order and bumps the week', async () => {
    // Queue an order on the Library so advanceWeek has work to do.
    act(() => {
      useBastionStore.getState().setOrder('library', 'Research')
    })
    expect(
      useBastionStore
        .getState()
        .bastions[useBastionStore.getState().activeBastionId].facilities.find(
          (f) => f.id === 'library',
        )?.pendingOrder,
    ).toBe('Research')

    render(<HeaderStrip />)
    const button = screen.getByRole('button', { name: /Advance week/i })
    await userEvent.click(button)

    const after = useBastionStore.getState().bastions[useBastionStore.getState().activeBastionId]
    expect(after.inGameWeek).toBe(2)
    expect(after.facilities.find((f) => f.id === 'library')?.pendingOrder).toBeUndefined()
    const orderLogs = after.log.filter((e) => e.type === 'bastion-order')
    expect(orderLogs).toHaveLength(1)
    expect(orderLogs[0].actor).toBe('library')
  })

  it('Back button is disabled when no history exists', () => {
    render(<HeaderStrip />)
    const back = screen.getByRole('button', { name: /Back/i }) as HTMLButtonElement
    expect(back.disabled).toBe(true)
  })
})
