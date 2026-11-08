import { createContext, useContext } from 'react'
import type { FitileRepository } from './local/repositories'

export const RepositoryContext = createContext<FitileRepository | null>(null)

export function useRepository() {
  const repository = useContext(RepositoryContext)
  if (!repository) throw new Error('useRepository must be used within DataProvider')
  return repository
}
