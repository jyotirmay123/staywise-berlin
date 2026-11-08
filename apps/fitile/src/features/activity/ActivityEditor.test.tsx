import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActivityEditor } from './ActivityEditor'

describe('ActivityEditor', () => {
  it('shows an editable treadmill calorie estimate using current weight', async () => {
    const user = userEvent.setup()
    render(<ActivityEditor weightKg={80} onSave={() => undefined}/>)
    await user.selectOptions(screen.getByLabelText('Activity type'),'treadmill')
    await user.clear(screen.getByLabelText('Duration in minutes'))
    await user.type(screen.getByLabelText('Duration in minutes'),'30')
    expect(screen.getByLabelText('Estimated calories')).toHaveValue(349)
    expect(screen.getByText('Estimate — you can change it')).toBeVisible()
  })
})
