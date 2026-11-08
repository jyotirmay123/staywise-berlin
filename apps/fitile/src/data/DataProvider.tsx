import { type PropsWithChildren, useMemo } from 'react'
import { FitileDb } from './local/FitileDb'
import { createFitileRepository } from './local/repositories'
import { RepositoryContext } from './useRepository'

export function DataProvider({ children, userId = 'demo-user' }: PropsWithChildren<{ userId?: string }>) {
  const repository = useMemo(() => createFitileRepository(new FitileDb(import.meta.env.MODE === 'pages' ? 'fittile-pages' : 'fittile'), userId), [userId])
  return <RepositoryContext.Provider value={repository}>{children}</RepositoryContext.Provider>
}
