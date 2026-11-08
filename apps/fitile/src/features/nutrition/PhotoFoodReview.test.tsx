import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PhotoFoodReview } from './PhotoFoodReview'

describe('PhotoFoodReview', () => {
  it('does not add a photo estimate before explicit confirmation', async () => {
    const user = userEvent.setup()
    render(<PhotoFoodReview onConfirm={(items) => sessionStorage.setItem('confirmed-items', String(items.length))} />)
    expect(sessionStorage.getItem('confirmed-items')).toBeNull()
    expect(screen.getByText(/estimate · medium confidence/i)).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Add confirmed items' }))
    expect(sessionStorage.getItem('confirmed-items')).toBe('3')
  })
})
