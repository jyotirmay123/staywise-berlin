import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OnboardingPage } from './OnboardingPage'

describe('OnboardingPage', () => {
  it('collects a goal and preferred workout split through a resumable wizard', async () => {
    const user = userEvent.setup()
    render(<OnboardingPage />)

    await user.click(screen.getByRole('button', { name: 'Lose fat' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Push / Pull / Legs' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByText(/adjustable dumbbells/i)).toBeVisible()
  })
})
