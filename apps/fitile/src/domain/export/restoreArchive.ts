import { FitileArchiveSchema } from './archiveSchema'
import { archiveChecksum, type AccountSnapshot } from './createArchive'
export function restoreArchive(value:unknown):AccountSnapshot {
  const parsed=FitileArchiveSchema.parse(value)
  if (parsed.checksum && parsed.checksum !== archiveChecksum(JSON.stringify((value as {data: unknown}).data))) throw new Error('Archive checksum mismatch')
  if (parsed.data.localDatabase && !parsed.checksum) throw new Error('Archive checksum required')
  return structuredClone(parsed.data) as AccountSnapshot
}
