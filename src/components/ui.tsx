import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function Button({ variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'link' }) {
  const styles = {
    primary: 'min-h-12 rounded-full bg-ink px-6 font-extrabold text-white shadow-[0_4px_0_#00000030] active:translate-y-0.5 active:shadow-[0_2px_0_#00000030] disabled:bg-[#a9a59c] disabled:shadow-none',
    secondary: 'min-h-12 rounded-full border-2 border-ink bg-white px-6 font-semibold text-ink',
    link: 'min-h-11 px-1 font-semibold text-ink underline underline-offset-4',
  }[variant]
  return <button type="button" className={`${styles} transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#1f6fd1] ${className}`} {...props} />
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
      <legend className="font-extrabold">{legend}</legend>
      {hint && <p className="mt-1 text-sm text-ink-soft">{hint}</p>}
      <div className="mt-2 grid grid-cols-2 gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className={`flex min-h-12 cursor-pointer items-center justify-center rounded-full border-2 px-3 text-center font-semibold transition has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-[#1f6fd1] ${
              value === o.value ? 'border-ink bg-ink text-white' : 'border-rule bg-white hover:border-ink'
            }`}
          >
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="sr-only" />
            {value === o.value && <span aria-hidden="true" className="mr-1.5 inline-block size-2.5 rounded-full bg-white" />}
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

/** A white card on the sheet. */
export function Panel({ children, className = '', label }: { children: ReactNode; className?: string; label?: string }) {
  return <section aria-label={label} className={`mt-4 rounded-[22px] bg-white p-4 shadow-card ${className}`}>{children}</section>
}
