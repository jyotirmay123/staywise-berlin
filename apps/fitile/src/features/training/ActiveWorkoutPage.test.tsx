import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActiveWorkoutPage } from './ActiveWorkoutPage'

describe('ActiveWorkoutPage', () => {
  it('logs a set and starts a rest timer', async () => {
    const user = userEvent.setup()
    render(<ActiveWorkoutPage onFinish={() => undefined} />)
    const weight = screen.getByLabelText('Dumbbell bench press: weight for set 1')
    await user.clear(weight)
    await user.type(weight, '12.5')
    await user.click(screen.getByRole('button', { name: 'Complete Dumbbell bench press set 1' }))
    expect(screen.getByRole('timer')).toBeVisible()
    expect(weight).toHaveValue(12.5)
  })
})
