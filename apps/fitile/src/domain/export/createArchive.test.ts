import { createArchive } from './createArchive'
import { restoreArchive } from './restoreArchive'

describe('Fitile archive round trip', () => {
  it('round-trips every user-owned aggregate', () => {
    const snapshot={workouts:[{id:'w-1'}],meals:[{id:'m-1'}],activities:[{id:'a-1'}],measurements:[{id:'b-1'}],settings:{goal:'fat-loss'},equipment:[{id:'dumbbells'}]}
    const archive=createArchive(snapshot,new Date('2026-08-28T20:00:00.000Z'))
    expect(restoreArchive(archive)).toEqual(snapshot)
  })

  it('rejects malformed content before returning restore data', () => {
    expect(()=>restoreArchive({format:'other'})).toThrow()
  })
})
