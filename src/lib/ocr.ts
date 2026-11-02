// On-phone text recognition for date labels. The photo stays on the phone:
// it is drawn to a canvas and read by Tesseract running in the browser.

import { createWorker, PSM, type Worker } from 'tesseract.js'

let workerPromise: Promise<Worker> | null = null
let mode: PSM | null = null

async function useMode(w: Worker, m: PSM) {
  if (mode === m) return
  await w.setParameters({ tessedit_pageseg_mode: m })
  mode = m
}

function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    const base = import.meta.env.BASE_URL + 'ocr/'
    workerPromise = createWorker('eng', 1, {
      workerPath: base + 'worker.min.js',
      corePath: base,
      langPath: base,
      gzip: true,
    }).then(async (w) => {
      await w.setParameters({
        tessedit_pageseg_mode: PSM.SPARSE_TEXT,
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/.-: ',
      })
      mode = PSM.SPARSE_TEXT
      return w
    })
    workerPromise.catch(() => {
      workerPromise = null
    })
  }
  return workerPromise
}

async function loadImage(file: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } finally {
    // The image is already decoded; the URL is no longer needed.
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }
}

/** Greyscale, scaled to a sensible size. */
function toGrey(img: HTMLImageElement): { canvas: HTMLCanvasElement; grey: Uint8ClampedArray } {
  const longest = Math.max(img.naturalWidth, img.naturalHeight)
  const scale = Math.min(2, 1600 / longest)
  const w = Math.round(img.naturalWidth * scale)
  const h = Math.round(img.naturalHeight * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0, w, h)
  const image = ctx.getImageData(0, 0, w, h)
  const grey = new Uint8ClampedArray(w * h)
  for (let i = 0; i < w * h; i++) {
    const r = image.data[i * 4], g = image.data[i * 4 + 1], b = image.data[i * 4 + 2]
    grey[i] = 0.299 * r + 0.587 * g + 0.114 * b
    image.data[i * 4] = image.data[i * 4 + 1] = image.data[i * 4 + 2] = grey[i]
  }
  ctx.putImageData(image, 0, 0)
  return { canvas, grey }
}

/**
 * Dot-matrix print (like the top of a milk carton) is made of separate dots.
 * Blurring joins the dots into strokes, then a black and white threshold
 * makes the characters solid for recognition.
 */
function joinDots(canvas: HTMLCanvasElement, grey: Uint8ClampedArray, radius: number, bias = 0): HTMLCanvasElement {
  const w = canvas.width, h = canvas.height
  const r = radius
  // Box blur, horizontal then vertical.
  const tmp = new Float32Array(w * h)
  const blurred = new Float32Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0, n = 0
      for (let k = -r; k <= r; k++) { const xx = x + k; if (xx >= 0 && xx < w) { sum += grey[y * w + xx]; n++ } }
      tmp[y * w + x] = sum / n
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0, n = 0
      for (let k = -r; k <= r; k++) { const yy = y + k; if (yy >= 0 && yy < h) { sum += tmp[yy * w + x]; n++ } }
      blurred[y * w + x] = sum / n
    }
  }
  // Otsu threshold.
  const hist = new Array(256).fill(0)
  for (const v of blurred) hist[Math.round(v)]++
  const total = blurred.length
  let sumAll = 0
  for (let i = 0; i < 256; i++) sumAll += i * hist[i]
  let sumB = 0, wB = 0, best = 0, threshold = 128
  for (let i = 0; i < 256; i++) {
    wB += hist[i]
    if (wB === 0) continue
    const wF = total - wB
    if (wF === 0) break
    sumB += i * hist[i]
    const mB = sumB / wB, mF = (sumAll - sumB) / wF
    const between = wB * wF * (mB - mF) ** 2
    if (between > best) { best = between; threshold = i }
  }
  const out = document.createElement('canvas')
  out.width = w
  out.height = h
  const ctx = out.getContext('2d')!
  const image = ctx.createImageData(w, h)
  for (let i = 0; i < total; i++) {
    const v = blurred[i] > threshold + bias ? 255 : 0
    image.data[i * 4] = image.data[i * 4 + 1] = image.data[i * 4 + 2] = v
    image.data[i * 4 + 3] = 255
  }
  ctx.putImageData(image, 0, 0)
  return out
}

/**
 * Reads the label several ways: the plain photo, and with the dots joined
 * by three amounts (print size varies from photo to photo). Returns the
 * text from each, so the date most of them agree on can be used.
 */
export async function readLabelTexts(file: Blob, onProgress?: (p: number) => void): Promise<string[]> {
  const worker = await getWorker()
  const img = await loadImage(file)
  const { canvas, grey } = toGrey(img)
  const base = Math.max(1, Math.round(Math.max(canvas.width, canvas.height) / 400))
  const variants = [
    () => canvas,
    () => joinDots(canvas, grey, Math.max(1, Math.round(base / 2))),
    () => joinDots(canvas, grey, base),
    () => joinDots(canvas, grey, Math.round(base * 1.5)),
  ]
  const texts: string[] = []
  await useMode(worker, PSM.SPARSE_TEXT)
  for (let i = 0; i < variants.length; i++) {
    onProgress?.(i / variants.length)
    texts.push((await worker.recognize(variants[i]())).data.text)
  }
  onProgress?.(1)
  return texts
}

/**
 * Bradley adaptive threshold: each pixel is compared with the average of
 * its neighbourhood, so glare on one side and shadow on the other don't
 * wash the print out (a single cut-off for the whole picture does).
 */
function adaptive(grey: Float32Array | Uint8ClampedArray, w: number, h: number, win: number, t = 0.13): Uint8ClampedArray {
  const integral = new Float64Array((w + 1) * (h + 1))
  for (let y = 0; y < h; y++) {
    let row = 0
    for (let x = 0; x < w; x++) {
      row += grey[y * w + x]
      integral[(y + 1) * (w + 1) + x + 1] = integral[y * (w + 1) + x + 1] + row
    }
  }
  const out = new Uint8ClampedArray(w * h)
  const r = Math.max(2, Math.round(win / 2))
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - r), y1 = Math.min(h - 1, y + r)
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - r), x1 = Math.min(w - 1, x + r)
      const count = (x1 - x0 + 1) * (y1 - y0 + 1)
      const sum = integral[(y1 + 1) * (w + 1) + x1 + 1] - integral[y0 * (w + 1) + x1 + 1] - integral[(y1 + 1) * (w + 1) + x0] + integral[y0 * (w + 1) + x0]
      out[y * w + x] = grey[y * w + x] * count < sum * (1 - t) ? 0 : 255
    }
  }
  return out
}

function boxBlur(grey: Uint8ClampedArray, w: number, h: number, r: number): Float32Array {
  const tmp = new Float32Array(w * h)
  const out = new Float32Array(w * h)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let s = 0, n = 0
    for (let k = -r; k <= r; k++) { const xx = x + k; if (xx >= 0 && xx < w) { s += grey[y * w + xx]; n++ } }
    tmp[y * w + x] = s / n
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let s = 0, n = 0
    for (let k = -r; k <= r; k++) { const yy = y + k; if (yy >= 0 && yy < h) { s += tmp[yy * w + x]; n++ } }
    out[y * w + x] = s / n
  }
  return out
}

function toCanvas(pixels: ArrayLike<number>, w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  const img = ctx.createImageData(w, h)
  for (let i = 0; i < w * h; i++) {
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = pixels[i]
    img.data[i * 4 + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  return c
}

/**
 * Reads the strip inside the date viewfinder's box. The strip is taken from
 * the camera at full detail, scaled to a steady height, stretched to full
 * contrast, and read three ways: plain, with a local (glare-proof) cut-off,
 * and with dot-matrix dots joined first. Returns the text from each.
 */
export async function readStripTexts(strip: HTMLCanvasElement): Promise<string[]> {
  const worker = await getWorker()
  const targetH = 150
  const scale = Math.min(3, targetH / strip.height, 1800 / strip.width)
  const w = Math.max(1, Math.round(strip.width * scale))
  const h = Math.max(1, Math.round(strip.height * scale))
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(strip, 0, 0, w, h)
  const data = ctx.getImageData(0, 0, w, h).data
  const grey = new Uint8ClampedArray(w * h)
  let lo = 255, hi = 0
  for (let i = 0; i < w * h; i++) {
    const v = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]
    grey[i] = v
    if (v < lo) lo = v
    if (v > hi) hi = v
  }
  // Stretch to full contrast (faint ink becomes dark).
  const range = Math.max(1, hi - lo)
  for (let i = 0; i < grey.length; i++) grey[i] = ((grey[i] - lo) * 255) / range

  const win = Math.round(h * 0.45)
  const dotR = Math.max(1, Math.round(h / 75))
  const variants = [
    toCanvas(grey, w, h),
    toCanvas(adaptive(grey, w, h, win), w, h),
    toCanvas(adaptive(boxBlur(grey, w, h, dotR), w, h, win, 0.08), w, h),
  ]
  await useMode(worker, PSM.SINGLE_BLOCK)
  const texts: string[] = []
  for (const v of variants) texts.push((await worker.recognize(v)).data.text)
  return texts
}

/** Loads the label reader ahead of time, so it works offline later. */
export async function warmUp() {
  await getWorker()
}
