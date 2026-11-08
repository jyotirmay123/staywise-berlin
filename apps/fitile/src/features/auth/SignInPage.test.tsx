import { render, screen } from '@testing-library/react'
import { SignInPage } from './SignInPage'

describe('SignInPage', () => {
  it('offers Google sign-in when cloud sync is configured', () => {
    render(<SignInPage cloudConfigured onGoogleSignIn={async () => undefined} />)
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeEnabled()
    expect(screen.getByText(/synchronizes your Fitile data/i)).toBeVisible()
  })

  it('explains the local-only limitation in demo mode', () => {
    render(<SignInPage cloudConfigured={false} onGoogleSignIn={async () => undefined} />)
    expect(screen.getByText('Demo mode · local only')).toBeVisible()
    expect(screen.queryByRole('button', { name: /continue with google/i })).not.toBeInTheDocument()
  })
})
