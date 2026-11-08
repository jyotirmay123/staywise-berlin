export type BarcodeResult = { rawValue: string; format: string }
export interface BarcodeScannerAdapter { available(): boolean; scan(source: ImageBitmapSource): Promise<BarcodeResult[]> }
