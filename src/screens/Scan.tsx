// Live barcode scanner. Camera frames are read on the phone and never sent.
import { useEffect, useRef, useState } from 'react'
import { PhotoButton } from '../components/PhotoButton'
import { Button } from '../components/ui'
import { readBarcode } from '../lib/barcode'

export function Scan({ onCode, onSkip }: { onCode: (code: string) => void; onSkip: () => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const [state, setState] = useState<'starting' | 'scanning' | 'no-camera'>('starting')
  const [photoMsg, setPhotoMsg] = useState<string | null>(null)
  const [typed, setTyped] = useState('')
  const done = useRef(false)

  useEffect(() => {
    let stream: MediaStream | null = null
    let timer = 0
    let cancelled = false
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false })
        if (cancelled) return
        const v = video.current!
        v.srcObject = stream
        await v.play()
        setState('scanning')
        const tick = async () => {
          if (cancelled || done.current) return
          if (v.videoWidth) {
            // Read the middle band of the picture, where the guide box is.
            const w = v.videoWidth, h = Math.round(v.videoHeight * 0.5)
            canvas.width = w
            canvas.height = h
            ctx.drawImage(v, 0, Math.round(v.videoHeight * 0.25), w, h, 0, 0, w, h)
            const code = await readBarcode(ctx.getImageData(0, 0, w, h)).catch(() => null)
            if (code && !done.current) {
              done.current = true
              navigator.vibrate?.(60)
              onCode(code)
              return
            }
          }
          timer = window.setTimeout(tick, 200)
        }
        tick()
      } catch {
        if (!cancelled) setState('no-camera')
      }
    }
    if ('mediaDevices' in navigator && typeof navigator.mediaDevices.getUserMedia === 'function') start()
    else setState('no-camera')

    return () => {
      cancelled = true
      clearTimeout(timer)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [onCode])

  const fromPhoto = async (file: File) => {
    setPhotoMsg('Reading the barcode…')
    const code = await readBarcode(file, true).catch(() => null)
    if (code) { done.current = true; onCode(code) } else setPhotoMsg("We couldn't find a barcode in that photo. Try again, closer and in focus.")
  }

  const digits = typed.replace(/\D/g, '')

  return (
    <>
      <h1 tabIndex={-1} className="display mt-6 text-3xl font-semibold">Scan the barcode</h1>
      <p className="mt-1 text-ink-soft">Hold the barcode inside the box. It's read on this phone.</p>

      <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-3xl bg-ink">
        <video ref={video} playsInline muted className="h-full w-full object-cover" aria-label="Camera view" />
        {state === 'scanning' && (
          <div className="pointer-events-none absolute inset-x-[10%] top-1/4 bottom-1/4 rounded-2xl border-4 border-white/90 shadow-[0_0_0_999px_#0d0f1466]" aria-hidden="true">
            <div className="scan-line absolute inset-x-3 h-0.5 bg-[#ff3b3b] shadow-[0_0_8px_#ff3b3b]" />
          </div>
        )}
        {state !== 'scanning' && (
          <p className="absolute inset-0 grid place-items-center p-6 text-center text-white" role="status">
            {state === 'starting' ? 'Starting the camera…' : 'The camera isn\'t available. Take a photo of the barcode or type its number instead.'}
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-3">
        <PhotoButton variant="secondary" onPhoto={fromPhoto}>Take a photo of the barcode instead</PhotoButton>
        {photoMsg && <p role="status" className="text-sm">{photoMsg}</p>}
      </div>

      <form
        className="mt-5 rounded-3xl bg-carton p-4"
        onSubmit={(e) => { e.preventDefault(); if (digits.length >= 8) { done.current = true; onCode(digits) } }}
      >
        <label htmlFor="code" className="font-semibold">Or type the barcode number</label>
        <div className="mt-2 flex gap-2">
          <input id="code" inputMode="numeric" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)}
            className="min-h-12 w-full rounded-2xl border-2 border-rule bg-white px-4 text-lg outline-none focus:border-brand" placeholder="9300000000000" />
          <Button type="submit" disabled={digits.length < 8}>Look up</Button>
        </div>
      </form>

      <Button variant="link" className="mt-4" onClick={onSkip}>No barcode? Type the food instead</Button>
    </>
  )
}
