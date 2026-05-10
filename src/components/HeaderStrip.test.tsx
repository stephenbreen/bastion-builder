import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HeaderStrip } from './HeaderStrip'
import { useBastionDataStore } from '../store/useBastionDataStore'
import { useUiStore } from '../store/useUiStore'
import { seedManor } from '../data/seed'

function resetStoreToSeed() {
  useBastionDataStore.setState((s) => {
    const id = s.activeBastionId
    return {
      bastions: { ...s.bastions, [id]: seedManor() },
      weekHistory: [],
    }
  })
  useUiStore.setState({ selectedFacilityId: null, viewMode: 'dm' })
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
    const id = useBastionDataStore.getState().activeBastionId
    // Queue an order on the Library so advanceWeek has work to do.
    act(() => {
      useBastionDataStore.getState().setOrder(id, 'library', 'Research')
    })
    expect(
      useBastionDataStore
        .getState()
        .bastions[id].facilities.find((f) => f.id === 'library')?.pendingOrder,
    ).toBe('Research')

    render(<HeaderStrip />)
    const button = screen.getByRole('button', { name: /Advance week/i })
    await userEvent.click(button)

    const after = useBastionDataStore.getState().bastions[id]
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
