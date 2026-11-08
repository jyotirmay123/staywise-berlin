import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataProvider } from './DataProvider'
import { usePersistentState } from './usePersistentState'
import { FitileDb } from './local/FitileDb'
function Editor(){const [value,setValue]=usePersistentState('test-note','');return <input aria-label="note" value={value} onChange={e=>setValue(e.target.value)}/>}
it('retains editable user data after leaving and reopening a page',async()=>{
  const db=new FitileDb();await db.settings.clear();db.close()
  const user=userEvent.setup()
  const first=render(<DataProvider userId="persistence-test"><Editor/></DataProvider>)
  await user.type(screen.getByLabelText('note'),'Saved locally')
  first.unmount()
  render(<DataProvider userId="persistence-test"><Editor/></DataProvider>)
  await waitFor(()=>expect(screen.getByLabelText('note')).toHaveValue('Saved locally'))
})
