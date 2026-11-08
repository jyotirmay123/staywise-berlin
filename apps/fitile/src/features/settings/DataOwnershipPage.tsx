import { useRef, useState } from 'react'
import { Cloud, Download, FileJson, RotateCcw, Shield, Upload } from 'lucide-react'
import { Button } from '../../design/components/Button'
import { Card } from '../../design/components/Card'
import { createCsvBundle } from '../../domain/export/createCsvBundle'
import { restoreArchive } from '../../domain/export/restoreArchive'
import { exportLocalArchive, importLocalArchive } from '../../data/local/backup'
import { useRepository } from '../../data/useRepository'
import { awaitLocalWrites, restoredEvent } from '../../data/usePersistentState'
import { saveTextFile } from '../../integrations/download/saveFile'
import { useAuth } from '../auth/authContext'

export function DataOwnershipPage() {
  const auth = useAuth()
  const repository = useRepository()
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)
  const exportData = async (csv = false) => {
    setBusy(true)
    try {
      await awaitLocalWrites()
      const archive = await exportLocalArchive(repository.db, repository.userId)
      if (csv) for (const [name, content] of Object.entries(createCsvBundle(archive.data))) saveTextFile(name, content, 'text/csv')
      else saveTextFile(`fittile-export-${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(archive,null,2), 'application/json')
      setMessage('Exported your saved local records. Illustrative dashboard values are excluded.')
    } catch { setMessage('Export failed. Browser storage may be unavailable; try again before closing this tab.') }
    finally { setBusy(false) }
  }
  const chooseArchive = async (file?: File) => {
    setPending(null)
    if (!file) return
    try {
      if (file.size > 20 * 1024 * 1024) throw new Error('Archive exceeds 20 MB')
      const raw: unknown = JSON.parse(await file.text())
      const data = restoreArchive(raw)
      if (!data.localDatabase) throw new Error('Older demo archives cannot restore real local data')
      setPending(raw)
      setMessage(`Ready to validate and merge ${data.workouts.length} workout, ${data.meals.length} meal and ${data.activities.length} activity records. Matching IDs will be updated; other local records remain.`)
    } catch { setMessage('This file is not a compatible local Fitile archive, or its checksum is invalid. No data was changed.') }
    if (fileRef.current) fileRef.current.value = ''
  }
  const applyArchive = async () => {
    setBusy(true)
    try {
      await awaitLocalWrites()
      await importLocalArchive(repository.db, repository.userId, pending)
      window.dispatchEvent(new Event(restoredEvent))
      setPending(null)
      setMessage('Archive imported into this browser. Saved records are available after reopening their page. No cloud upload was performed.')
    } catch { setMessage('Archive validation or storage failed. No data was changed.') }
    finally { setBusy(false) }
  }
  return <section className="settings-grid">
    <Card><span className="icon-tile"><Cloud/></span><p className="eyebrow">Storage</p><h2>{auth.status==='demo'?'Local browser storage':'Optional cloud connection'}</h2><p className="muted">{auth.status==='demo'?'Your edits are saved in IndexedDB on this device. Export JSON to transfer them to another browser. GitHub Pages does not provide a backend or automatic sync.':'Sign-in is configured. The local database and export remain available. A configured backend and running sync engine are required for synchronization.'}</p></Card>
    <Card><span className="icon-tile"><FileJson/></span><p className="eyebrow">Complete archive</p><h2>Export everything</h2><p className="muted">Versioned JSON includes all saved local settings, workouts, meals, activity, equipment and sync bookkeeping. CSV files are readable summaries; use JSON for restore.</p><div className="data-actions"><Button disabled={busy} onClick={()=>void exportData()}><Download size={16}/> JSON</Button><Button disabled={busy} variant="secondary" onClick={()=>void exportData(true)}>CSV files</Button></div></Card>
    <Card><span className="icon-tile"><RotateCcw/></span><p className="eyebrow">Restore</p><h2>Bring your data back</h2><p className="muted">Choose a JSON archive, then merge it into this browser. The complete archive is validated before a single transaction applies records.</p><input ref={fileRef} hidden type="file" accept="application/json,.json" onChange={event=>void chooseArchive(event.target.files?.[0])}/><div className="data-actions"><Button disabled={busy} variant="secondary" onClick={()=>fileRef.current?.click()}><Upload size={16}/> Choose archive</Button>{pending!==null&&<Button disabled={busy} onClick={()=>void applyArchive()}>Import archive</Button>}</div>{message&&<p className="restore-message" role="status">{message}</p>}</Card>
    <Card><span className="icon-tile"><Shield/></span><p className="eyebrow">Ownership</p><h2>Your local backup.</h2><p className="muted">Exports may contain sensitive health information. Keep your backup private. Clearing browser data removes local records; periodically export JSON. The dashboard, trends and photo examples remain illustrative.</p></Card>
  </section>
}
