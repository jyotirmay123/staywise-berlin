import { manifest } from './manifest'

describe('Fitile PWA manifest', () => {
  it('is installable with standalone display and maskable icons', () => {
    expect(manifest).toMatchObject({name:'Fitile — Train, Recover, Fuel',short_name:'Fitile',display:'standalone',start_url:'/'})
    expect(manifest.icons).toEqual(expect.arrayContaining([expect.objectContaining({sizes:'512x512',purpose:'any maskable'})]))
  })
})
