// Reads product barcodes on the phone. The barcode reader (WebAssembly) is
// served from this app, not a CDN. Camera frames never leave the phone.
import { prepareZXingModule, readBarcodes } from 'zxing-wasm/reader'
import wasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url'

let prepared = false
function prepare() {
  if (prepared) return
  prepared = true
  prepareZXingModule({
    overrides: { locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? wasmUrl : prefix + path) },
  })
}

const OPTIONS = { formats: ['EAN13', 'EAN8', 'UPCA', 'UPCE'] as ('EAN13' | 'EAN8' | 'UPCA' | 'UPCE')[], maxNumberOfSymbols: 1 }

/** Returns the barcode number, or null if none was found. */
export async function readBarcode(input: Blob | ImageData, tryHarder = false): Promise<string | null> {
  prepare()
  const results = await readBarcodes(input, { ...OPTIONS, tryHarder, tryRotate: tryHarder, tryInvert: false })
  const hit = results.find((r) => r.isValid && /^\d{8,14}$/.test(r.text))
  return hit?.text ?? null
}

/** Loads the barcode reader ahead of time, so it works offline later. */
export async function warmUp() {
  prepare()
  await fetch(wasmUrl)
}
