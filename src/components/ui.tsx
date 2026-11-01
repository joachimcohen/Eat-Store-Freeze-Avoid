import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function Button({ variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'link' }) {
  const styles = {
    primary: 'min-h-12 rounded-lg bg-ink px-5 font-semibold text-carton disabled:opacity-40',
    secondary: 'min-h-12 rounded-lg border-2 border-ink bg-card px-5 font-semibold',
    link: 'min-h-11 px-1 font-medium underline underline-offset-4',
  }[variant]
  return <button type="button" className={`${styles} focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-freeze ${className}`} {...props} />
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
    <fieldset className="mt-5">
      <legend className="font-semibold">{legend}</legend>
      {hint && <p className="mt-1 text-sm text-ink-soft">{hint}</p>}
      <div className="mt-2 grid grid-cols-2 gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className={`flex min-h-12 cursor-pointer items-center justify-center rounded-lg border-2 px-3 text-center font-medium has-focus-visible:outline-3 has-focus-visible:outline-freeze ${
              value === o.value ? 'border-ink bg-ink text-carton' : 'border-rule bg-card'
            }`}
          >
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="sr-only" />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function Header({ onHome }: { onHome?: () => void }) {
  return (
    <header className="border-b-2 border-dashed border-ink pb-3">
      <button type="button" onClick={onHome} className="print text-left text-base leading-tight sm:text-xl" aria-label="Eat, Store, Freeze, Avoid: start again">
        Eat · Store · Freeze · Avoid
      </button>
    </header>
  )
}
