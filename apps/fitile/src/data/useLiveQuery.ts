import { liveQuery } from 'dexie'
import { useEffect, useState } from 'react'

export function useFitileLiveQuery<T>(query: () => Promise<T>, initialValue: T) {
  const [value, setValue] = useState(initialValue)
  useEffect(() => {
    const subscription = liveQuery(query).subscribe({ next: setValue, error: console.error })
    return () => subscription.unsubscribe()
  }, [query])
  return value
}
