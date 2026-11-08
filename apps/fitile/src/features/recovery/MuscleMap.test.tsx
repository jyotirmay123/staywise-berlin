import { render, screen } from '@testing-library/react'
import { MuscleMap } from './MuscleMap'

describe('MuscleMap', () => {
  it('communicates readiness without relying on color', () => {
    render(<MuscleMap selected="chest" onSelect={() => undefined} readiness={{ chest: 28 }} />)
    expect(screen.getByRole('button', { name: 'Chest — 28% ready, fatigued' })).toBeVisible()
  })
})
