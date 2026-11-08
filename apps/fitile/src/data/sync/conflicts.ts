type Timestamped = { updatedAt: string }

const withoutTimestamp = (record: Timestamped) => {
  const entries = Object.entries(record).filter(([key]) => key !== 'updatedAt')
  return Object.fromEntries(entries)
}

export function resolveNewestUpdate<T extends Timestamped>(local: T, remote: T): { winner: T; loser?: T; conflicted: boolean } {
  if (JSON.stringify(withoutTimestamp(local)) === JSON.stringify(withoutTimestamp(remote))) {
    return { winner: new Date(remote.updatedAt) > new Date(local.updatedAt) ? remote : local, loser: undefined, conflicted: false }
  }
  return new Date(remote.updatedAt) > new Date(local.updatedAt)
    ? { winner: remote, loser: local, conflicted: true }
    : { winner: local, loser: remote, conflicted: true }
}
