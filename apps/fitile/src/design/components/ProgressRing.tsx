type ProgressRingProps = {
  value: number
  label: string
  size?: number
  color?: string
}

export function ProgressRing({ value, label, size = 72, color = 'var(--brand)' }: ProgressRingProps) {
  const normalized = Math.max(0, Math.min(100, value))
  return (
    <div
      aria-label={`${label}: ${normalized}%`}
      role="img"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        background: `conic-gradient(${color} ${normalized * 3.6}deg, var(--surface-soft) 0)`,
      }}
    >
      <span style={{ width: size - 12, height: size - 12, display: 'grid', placeItems: 'center', borderRadius: '50%', background: 'var(--surface)', fontWeight: 800 }}>
        {normalized}%
      </span>
    </div>
  )
}
