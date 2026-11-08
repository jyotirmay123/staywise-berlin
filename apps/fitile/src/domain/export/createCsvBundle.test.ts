import { createCsvBundle } from './createCsvBundle'

describe('createCsvBundle', () => {
  it('escapes commas and quotes in user-owned records', () => {
    const files=createCsvBundle({workouts:[{id:'w-1',note:'Hard, but "good"'}],meals:[],activities:[],measurements:[],settings:{},equipment:[]})
    expect(files['workouts.csv']).toContain('"Hard, but ""good"""')
  })
})
