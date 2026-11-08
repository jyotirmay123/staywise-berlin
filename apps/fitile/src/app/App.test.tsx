import { render, screen } from '@testing-library/react'
import { App } from './App'

describe('Fitile application shell', () => {
  it('shows the five primary destinations', () => {
    render(<App />)

    for (const label of ['Today', 'Train', 'Food', 'Progress', 'Profile']) {
      expect(screen.getByRole('link', { name: label })).toBeVisible()
    }
  })
})
