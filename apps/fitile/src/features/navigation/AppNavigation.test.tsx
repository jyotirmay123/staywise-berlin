import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppNavigation } from './AppNavigation'

describe('AppNavigation', () => {
  it('marks the current destination', () => {
    render(
      <MemoryRouter initialEntries={['/train']}>
        <AppNavigation />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Train' })).toHaveAttribute('aria-current', 'page')
  })
})
