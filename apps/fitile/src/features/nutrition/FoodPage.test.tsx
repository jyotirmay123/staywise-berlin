import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FoodPage } from './FoodPage'

describe('FoodPage', () => {
  it('adds a searched food and updates the daily calorie total', async () => {
    const user = userEvent.setup()
    render(<FoodPage />)
    expect(screen.getByText('0', {selector:'.nutrition-summary strong'})).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Add food' }))
    await user.click(screen.getByRole('button', { name: /add skyr yoghurt/i }))
    expect(screen.getByText('135', {selector:'.nutrition-summary strong'})).toBeVisible()
  })
})
