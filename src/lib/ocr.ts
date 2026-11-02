// On-phone text recognition for date labels. The photo stays on the phone:
// it is drawn to a canvas and read by Tesseract running in the browser.

import { createWorker, PSM, type Worker } from 'tesseract.js'

let workerPromise: Promise<Worker> | null = null

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
  for (let i = 0; i < variants.length; i++) {
    onProgress?.(i / variants.length)
    texts.push((await worker.recognize(variants[i]())).data.text)
  }
  onProgress?.(1)
  return texts
}

/** Loads the label reader ahead of time, so it works offline later. */
export async function warmUp() {
  await getWorker()
}
