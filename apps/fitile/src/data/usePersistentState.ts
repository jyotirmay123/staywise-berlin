import { useCallback, useContext, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { RepositoryContext } from './useRepository'

let pendingWrites = Promise.resolve()
export const awaitLocalWrites = () => pendingWrites
export const restoredEvent = 'fitile-data-restored'

/** UI values live in the account's IndexedDB settings rows, included in JSON backups. */
export function usePersistentState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const repository = useContext(RepositoryContext)
  const [value, setValue] = useState(initial)
  const current = useRef(value)
  const changed = useRef(false)
  const defaults = useRef(initial)
  useEffect(() => {
    if (!repository) return
    let alive = true
    changed.current = false
    const load = async () => {
      await awaitLocalWrites()
      const row = await repository.db.settings.get(`${repository.userId}:${key}`)
      if (alive && !changed.current) {
        const next = row ? row.value as T : defaults.current
        current.current = next
        setValue(next)
      }
    }
    const restored = () => { changed.current = false; void load().catch(reportStorageError) }
    void load().catch(reportStorageError)
    window.addEventListener(restoredEvent, restored)
    return () => { alive = false; window.removeEventListener(restoredEvent, restored) }
  }, [repository, key])
  const update: Dispatch<SetStateAction<T>> = useCallback((action) => {
    const next = typeof action === 'function' ? (action as (previous:T)=>T)(current.current) : action
    changed.current = true
    current.current = next
    setValue(next)
    if (!repository) return
    pendingWrites = pendingWrites.catch(()=>undefined).then(async()=> {
      await repository.db.settings.put({id:`${repository.userId}:${key}`, userId:repository.userId, value:next, updatedAt:new Date().toISOString()})
    })
    void pendingWrites.catch(reportStorageError)
  }, [repository,key])
  return [value,update]
}
function reportStorageError() {
  window.dispatchEvent(new Event('fitile-storage-error'))
}
