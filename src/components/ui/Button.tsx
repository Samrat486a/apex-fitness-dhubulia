import { ArrowRight, Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Variant = 'primary' | 'dark' | 'outline' | 'ghost' | 'light' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const VARIANT: Record<Variant, string> = {
  primary:
    'shine bg-cyan-400 text-ink hover:-translate-y-0.5 hover:bg-cyan-300 shadow-[0_10px_30px_-10px_rgb(34_211_238/0.7)] hover:shadow-[0_16px_40px_-10px_rgb(34_211_238/0.9)]',
  dark: 'shine bg-ink text-white hover:-translate-y-0.5 hover:bg-ink-3 shadow-[0_10px_24px_-12px_rgb(10_14_17/0.6)] hover:shadow-[0_14px_30px_-12px_rgb(6_182_212/0.55)]',
  outline: 'border border-line bg-white text-ink hover:-translate-y-0.5 hover:border-cyan-500/60 hover:shadow-[0_10px_24px_-14px_rgb(6_182_212/0.6)]',
  ghost: 'text-ink hover:bg-ink/5',
  light: 'border border-white/15 bg-white/5 text-white hover:-translate-y-0.5 hover:bg-white/10 hover:border-cyan-300/50',
  danger: 'bg-red-600 text-white hover:bg-red-500',
}
const SIZE: Record<Size, string> = {
  sm: 'h-9 px-4 text-[13px] gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-13 px-7 text-[15px] gap-2.5',
}

interface Common {
  variant?: Variant
  size?: Size
  arrow?: boolean
  icon?: ReactNode
  loading?: boolean
  block?: boolean
  className?: string
  children: ReactNode
}

type Props = Common &
  (
    | ({ to: string; href?: never } & { onClick?: () => void })
    | ({ href: string; to?: never } & { onClick?: () => void; target?: string })
    | ({ to?: never; href?: never } & ButtonHTMLAttributes<HTMLButtonElement>)
  )

export function Button(props: Props) {
  const { variant = 'dark', size = 'md', arrow, icon, loading, block, className = '', children, ...rest } = props
  const cls = `group/btn relative inline-flex select-none items-center justify-center whitespace-nowrap rounded-full font-semibold tracking-[-0.01em] transition-all duration-300 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55 ${VARIANT[variant]} ${SIZE[size]} ${block ? 'w-full' : ''} ${className}`
  const content = (
    <>
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      <span>{children}</span>
      {arrow && !loading && <ArrowRight className="size-4 transition-transform duration-300 group-hover/btn:translate-x-0.5" />}
    </>
  )
  if ('to' in rest && rest.to) {
    return (
      <Link to={rest.to} onClick={rest.onClick} className={cls}>
        {content}
      </Link>
    )
  }
  if ('href' in rest && rest.href) {
    const { href, target, onClick } = rest as { href: string; target?: string; onClick?: () => void }
    return (
      <a href={href} target={target} rel={target === '_blank' ? 'noopener noreferrer' : undefined} onClick={onClick} className={cls}>
        {content}
      </a>
    )
  }
  const { type = 'button', disabled, ...buttonRest } = rest as ButtonHTMLAttributes<HTMLButtonElement>
  return (
    <button type={type} disabled={disabled || loading} className={cls} {...buttonRest}>
      {content}
    </button>
  )
}

export function IconButton({ label, children, className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex size-10 items-center justify-center rounded-full border border-line bg-white text-ink transition hover:border-ink/25 active:scale-95 ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
