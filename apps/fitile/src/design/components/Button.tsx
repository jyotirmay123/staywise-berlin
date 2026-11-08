import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
}>

export function Button({ variant = 'primary', className = '', type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={`button button--${variant} ${className}`} {...props} />
}
