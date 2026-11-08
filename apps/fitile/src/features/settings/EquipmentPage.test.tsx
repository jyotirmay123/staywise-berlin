import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EquipmentPage } from './EquipmentPage'

describe('EquipmentPage', () => {
  it('starts with no saved equipment and adds custom equipment', async () => {
    const user = userEvent.setup()
    render(<EquipmentPage />)

    expect(screen.getByText('No saved equipment yet.')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Add equipment' }))
    await user.type(screen.getByLabelText('Equipment name'), 'Pull-up bar')
    await user.click(screen.getByRole('button', { name: 'Save equipment' }))
    expect(screen.getByText('Pull-up bar')).toBeVisible()
  })
})
