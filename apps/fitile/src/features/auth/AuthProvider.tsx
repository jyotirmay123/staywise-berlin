import { type PropsWithChildren, useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { cloudConfigured, supabase } from '../../integrations/supabase/client'
import { AuthContext, type AuthContextValue } from './authContext'

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(cloudConfigured)

  useEffect(() => {
    if (!supabase) return
    void supabase.auth.getUser().then(({ data }) => { setUser(data.user); setLoading(false) })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => { setUser(session?.user ?? null); setLoading(false) })
    return () => data.subscription.unsubscribe()
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    status: !cloudConfigured ? 'demo' : loading ? 'loading' : user ? 'authenticated' : 'anonymous',
    async signInWithGoogle() {
      if (!supabase) return
      const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}auth/callback`
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })
      if (error) throw error
    },
    async signOut() { if (supabase) await supabase.auth.signOut() },
  }), [loading, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
