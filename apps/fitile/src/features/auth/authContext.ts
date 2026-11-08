import { createContext, useContext } from 'react'
import type { User } from '@supabase/supabase-js'

export type AuthContextValue = {
  user: User | null
  status: 'loading' | 'authenticated' | 'anonymous' | 'demo'
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within AuthProvider')
  return value
}
