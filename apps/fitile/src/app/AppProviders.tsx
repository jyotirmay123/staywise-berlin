import type { PropsWithChildren } from 'react'
import { DataProvider } from '../data/DataProvider'
import { AuthProvider } from '../features/auth/AuthProvider'
import { useAuth } from '../features/auth/authContext'

function UserDataProvider({ children }: PropsWithChildren) {
  const { user } = useAuth()
  return <DataProvider userId={user?.id ?? 'demo-user'}>{children}</DataProvider>
}

export function AppProviders({ children }: PropsWithChildren) {
  return <AuthProvider><UserDataProvider>{children}</UserDataProvider></AuthProvider>
}
