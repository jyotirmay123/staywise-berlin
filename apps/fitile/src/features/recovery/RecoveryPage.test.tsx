import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecoveryPage } from './RecoveryPage'

describe('RecoveryPage', () => {
  it('shows which completed sets reduced readiness', async () => {
    const user = userEvent.setup()
    render(<RecoveryPage />)
    await user.click(screen.getByRole('button', { name: /chest —/i }))
    expect(screen.getByText(/dumbbell bench press · 3 sets/i)).toBeVisible()
  })
})
