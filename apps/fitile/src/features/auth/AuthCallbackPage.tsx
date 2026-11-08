import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../integrations/supabase/client'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code')
    if (!code || !supabase) { navigate('/', { replace: true }); return }
    void supabase.auth.exchangeCodeForSession(code).finally(() => navigate('/', { replace: true }))
  }, [navigate])
  return <main className="page-placeholder"><div><p className="eyebrow">Secure sign-in</p><h1>Connecting Fitile…</h1></div></main>
}
