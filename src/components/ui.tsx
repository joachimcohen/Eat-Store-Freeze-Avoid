import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function Button({ variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'link' }) {
  const styles = {
    primary: 'min-h-12 rounded-full bg-brand px-6 font-semibold text-white shadow-[0_4px_0_var(--color-brand-deep)] active:translate-y-0.5 active:shadow-[0_2px_0_var(--color-brand-deep)] disabled:bg-[#9aa8bf] disabled:shadow-none',
    secondary: 'min-h-12 rounded-full border-2 border-brand bg-white px-6 font-semibold text-brand-deep',
    link: 'min-h-11 px-1 font-medium text-brand-deep underline underline-offset-4',
  }[variant]
  return <button type="button" className={`${styles} transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand ${className}`} {...props} />
}

/** A group of large choice buttons that behave like radio buttons. */
export function Choice<T extends string>({ legend, name, options, value, onChange, hint }: {
  legend: string
  name: string
  options: { value: T; label: string }[]
  value: T | null
  onChange: (v: T) => void
  hint?: ReactNode
}) {
  return (
    <fieldset className="mt-5 first:mt-0">
      <legend className="font-semibold">{legend}</legend>
      {hint && <p className="mt-1 text-sm text-ink-soft">{hint}</p>}
      <div className="mt-2 grid grid-cols-2 gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className={`flex min-h-12 cursor-pointer items-center justify-center rounded-full border-2 px-3 text-center font-medium transition has-focus-visible:outline-3 has-focus-visible:outline-brand ${
              value === o.value ? 'border-brand bg-brand text-white' : 'border-rule bg-white hover:border-brand'
            }`}
          >
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="sr-only" />
            {value === o.value && <span aria-hidden="true" className="mr-1">✓</span>}
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

/** A soft milk-blue panel. */
export function Panel({ children, className = '', label }: { children: ReactNode; className?: string; label?: string }) {
  return <section aria-label={label} className={`mt-4 rounded-3xl bg-carton p-4 ${className}`}>{children}</section>
}
