import { FitileArchiveSchema } from './archiveSchema'

describe('FitileArchiveSchema', () => {
  const validArchive = {
    format: 'fittile-archive',
    version: '1.0.0',
    createdAt: '2026-08-28T20:00:00.000Z',
    data: { workouts: [], meals: [], activities: [], measurements: [], settings: {} },
  }

  it('accepts a version-one Fitile archive', () => {
    expect(FitileArchiveSchema.parse(validArchive)).toEqual(validArchive)
  })

  it('rejects an archive from an unsupported major version', () => {
    expect(() => FitileArchiveSchema.parse({ ...validArchive, version: '2.0.0' })).toThrow(/version/i)
  })
})
