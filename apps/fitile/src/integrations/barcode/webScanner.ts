import type { BarcodeResult, BarcodeScannerAdapter } from './types'

type BarcodeDetectorLike = { detect(source: ImageBitmapSource): Promise<BarcodeResult[]> }
type BarcodeDetectorConstructor = new (options:{formats:string[]})=>BarcodeDetectorLike

export const webBarcodeScanner: BarcodeScannerAdapter = {
  available: () => 'BarcodeDetector' in globalThis,
  async scan(source) {
    const Detector = (globalThis as typeof globalThis & { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector
    if (!Detector) return []
    return new Detector({ formats: ['ean_13','ean_8','upc_a','upc_e'] }).detect(source)
  },
}
