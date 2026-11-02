// Live date viewfinder. The person lines the date up inside a thin box; the
// app reads just that strip from the camera, frame after frame, until two
// readings agree. Camera frames never leave the phone.
import { useEffect, useRef, useState } from 'react'
import { PhotoButton } from '../components/PhotoButton'
import { Button } from '../components/ui'
import { agreedReading, readLabel, type LabelReading } from '../lib/label'
import { readStripTexts } from '../lib/ocr'
import { formatDate, localToday } from '../rules/dates'

/** The guide box, as fractions of the camera view. */
const BOX = { left: 0.06, width: 0.88, top: 0.38, height: 0.24 }
/** A little extra around the box, in case the date isn't perfectly inside it. */
const MARGIN = 0.25

type TrackCaps = MediaTrackCapabilities & { torch?: boolean; zoom?: { min: number; max: number } }

export function DateScan({ onRead, onPhoto, onTypeInstead }: {
  onRead: (reading: LabelReading, texts: string[]) => void
  onPhoto: (f: File) => void
  onTypeInstead: () => void
}) {
  const video = useRef<HTMLVideoElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const track = useRef<MediaStreamTrack | null>(null)
  const [state, setState] = useState<'starting' | 'scanning' | 'no-camera'>('starting')
  const [seen, setSeen] = useState<LabelReading | null>(null)
  const [frames, setFrames] = useState(0)
  const [torch, setTorch] = useState<boolean | null>(null)
  const [zoom, setZoom] = useState<{ on: boolean; level: number } | null>(null)
  const texts = useRef<string[]>([])
  const done = useRef(false)

  useEffect(() => {
    let stream: MediaStream | null = null
    let cancelled = false
    const strip = document.createElement('canvas')
    const ctx = strip.getContext('2d', { willReadFrequently: true })!
    const today = localToday()

    // Works out which part of the camera picture is under the guide box
    // (the picture is cropped to fill the frame).
    const grab = () => {
      const v = video.current!, f = frame.current!
      const vw = v.videoWidth, vh = v.videoHeight
      const cw = f.clientWidth, ch = f.clientHeight
      const scale = Math.max(cw / vw, ch / vh)
      const ox = (cw - vw * scale) / 2, oy = (ch - vh * scale) / 2
      const bx = cw * BOX.left, by = ch * (BOX.top - (BOX.height * MARGIN) / 2)
      const bw = cw * BOX.width, bh = ch * BOX.height * (1 + MARGIN)
      const sx = Math.max(0, (bx - ox) / scale), sy = Math.max(0, (by - oy) / scale)
      const sw = Math.min(vw - sx, bw / scale), sh = Math.min(vh - sy, bh / scale)
      strip.width = Math.round(sw)
      strip.height = Math.round(sh)
      ctx.drawImage(v, sx, sy, sw, sh, 0, 0, strip.width, strip.height)
      return strip
    }

    async function loop() {
      while (!cancelled && !done.current) {
        const v = video.current
        if (!v || !v.videoWidth) { await new Promise((r) => setTimeout(r, 150)); continue }
        const got = await readStripTexts(grab()).catch(() => [] as string[])
        if (cancelled || done.current) return
        // Keep the most recent readings: earlier frames may have been blurry.
        texts.current = [...texts.current, ...got].slice(-12)
        setFrames((n) => n + 1)
        const best = got.map((t) => readLabel(t, today)).find((r) => r.date) ?? null
        if (best) setSeen(best)
        const agreed = agreedReading(texts.current, today, 2)
        if (agreed) {
          done.current = true
          navigator.vibrate?.(60)
          onRead(agreed, texts.current)
          return
        }
      }
    }

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        })
        if (cancelled) return
        const t = stream.getVideoTracks()[0]
        track.current = t
        const caps = (t.getCapabilities?.() ?? {}) as TrackCaps
        // Keep refocusing as the phone moves closer (ignored where unsupported).
        t.applyConstraints({ advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet] }).catch(() => {})
        if (caps.torch) setTorch(false)
        if (caps.zoom && caps.zoom.max >= 1.5) setZoom({ on: false, level: Math.min(2, caps.zoom.max) })
        const v = video.current!
        v.srcObject = stream
        await v.play()
        setState('scanning')
        loop()
      } catch {
        if (!cancelled) setState('no-camera')
      }
    }
    if ('mediaDevices' in navigator && typeof navigator.mediaDevices.getUserMedia === 'function') start()
    else setState('no-camera')

    return () => {
      cancelled = true
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [onRead])

  const toggleTorch = () => {
    const next = !torch
    track.current?.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] }).then(() => setTorch(next)).catch(() => setTorch(null))
  }
  const toggleZoom = () => {
    if (!zoom) return
    const on = !zoom.on
    track.current?.applyConstraints({ advanced: [{ zoom: on ? zoom.level : 1 } as MediaTrackConstraintSet] }).then(() => setZoom({ ...zoom, on })).catch(() => setZoom(null))
  }

  const useWhatWeSee = () => {
    if (!seen) return
    done.current = true
    onRead(seen, texts.current)
  }

  return (
    <>
      <h1 tabIndex={-1} className="display mt-6 text-3xl">Scan the date</h1>
      <p className="mt-1 text-ink-soft">Fit the date inside the box. Hold steady, about a hand's width away. It's read on this phone.</p>

      <div ref={frame} className="relative mt-4 aspect-[4/3] overflow-hidden rounded-[22px] bg-ink">
        <video ref={video} playsInline muted className="h-full w-full object-cover" aria-label="Camera view" />
        {state === 'scanning' && (
          <div
            className="pointer-events-none absolute rounded-xl border-4 border-white shadow-[0_0_0_999px_#14141480]"
            style={{ left: `${BOX.left * 100}%`, width: `${BOX.width * 100}%`, top: `${BOX.top * 100}%`, height: `${BOX.height * 100}%` }}
            aria-hidden="true"
          />
        )}
        {state !== 'scanning' && (
          <p className="absolute inset-0 grid place-items-center p-6 text-center text-white" role="status">
            {state === 'starting' ? 'Starting the camera…' : "The camera isn't available. Take a photo of the date or type it in instead."}
          </p>
        )}
        {state === 'scanning' && (torch !== null || zoom) && (
          <div className="absolute right-3 bottom-3 flex gap-2">
            {zoom && (
              <button type="button" onClick={toggleZoom} aria-pressed={zoom.on} className="min-h-11 rounded-full bg-white/90 px-4 text-sm font-extrabold text-ink">
                {zoom.on ? 'Zoom on' : 'Zoom'}
              </button>
            )}
            {torch !== null && (
              <button type="button" onClick={toggleTorch} aria-pressed={torch} className="min-h-11 rounded-full bg-white/90 px-4 text-sm font-extrabold text-ink">
                {torch ? 'Torch on' : 'Torch'}
              </button>
            )}
          </div>
        )}
      </div>

      {state === 'scanning' && (
        <div className="mt-4 rounded-[22px] bg-white p-4 shadow-card" role="status" aria-live="polite">
          {seen?.date ? (
            <>
              <p className="text-sm text-ink-soft">Reading… so far we see:</p>
              <p className="print mt-1 text-lg">{seen.matchedText ?? formatDate(seen.date)}</p>
              <Button variant="secondary" className="mt-3 w-full" onClick={useWhatWeSee}>Use this</Button>
            </>
          ) : (
            <p className="font-semibold">Looking for a date…</p>
          )}
          {frames >= 6 && !seen?.date && (
            <ul className="mt-2 list-disc pl-5 text-sm text-ink-soft">
              <li>Move a little closer or further away until it's sharp.</li>
              <li>Tilt the pack to get rid of glare{torch !== null ? ', or try the torch' : ''}.</li>
              <li>On tins and jars, check the bottom or lid.</li>
            </ul>
          )}
        </div>
      )}

      <div className="mt-4 grid gap-3">
        <PhotoButton variant="secondary" onPhoto={onPhoto}>Take a photo instead</PhotoButton>
        <Button variant="link" onClick={onTypeInstead}>Type the date instead</Button>
      </div>
    </>
  )
}
