import { z } from 'zod'

export const FitileArchiveSchema = z.object({
  format: z.literal('fittile-archive'),
  version: z.string().refine((version) => /^1\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/.test(version), 'Unsupported Fitile archive version'),
  createdAt: z.iso.datetime(),
  checksum: z.string().optional(),
  data: z.object({
    workouts: z.array(z.record(z.string(), z.json())),
    meals: z.array(z.record(z.string(), z.json())),
    activities: z.array(z.record(z.string(), z.json())),
    measurements: z.array(z.record(z.string(), z.json())),
    settings: z.record(z.string(), z.json()),
    equipment: z.array(z.record(z.string(), z.json())).optional(),
  }).passthrough(),
})

export type FitileArchive = z.infer<typeof FitileArchiveSchema>
