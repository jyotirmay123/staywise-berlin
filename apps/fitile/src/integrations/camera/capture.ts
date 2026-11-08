export async function compressFoodPhoto(file: File, maxPixels = 1_600_000): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, Math.sqrt(maxPixels / (bitmap.width * bitmap.height)))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('photo-compression-failed')), 'image/jpeg', .82))
}
