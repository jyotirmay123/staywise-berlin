import type { HTMLAttributes, PropsWithChildren } from 'react'

type CardProps = PropsWithChildren<HTMLAttributes<HTMLElement> & {
  as?: 'article' | 'section' | 'div'
  padded?: boolean
  accent?: boolean
}>

export function Card({ as: Component = 'section', padded = true, accent = false, className = '', ...props }: CardProps) {
  const classes = ['card', padded && 'card--padded', accent && 'card--accent', className].filter(Boolean).join(' ')
  return <Component className={classes} {...props} />
}
