// Opens the camera (or photo library). The photo is only read on this phone.
import { useRef } from 'react'
import { Button } from './ui'

export function PhotoButton({ onPhoto, children, variant = 'primary', className = '' }: {
  onPhoto: (file: File) => void
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  className?: string
}) {
  const input = useRef<HTMLInputElement>(null)
  return (
    <>
      <Button variant={variant} className={className} onClick={() => input.current?.click()}>{children}</Button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) onPhoto(file)
        }}
      />
    </>
  )
}
