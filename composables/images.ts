export const useImage = () => {
  const imageName = ref('')
  const imageSize = ref('256')
  const downloadImage = (canvas: HTMLCanvasElement | null) => {
    const { renderPixel } = useRender()
    canvas!.width = Number(imageSize.value)
    canvas!.height = Number(imageSize.value)
    const originalScale = pixelSize.value / ((pixelResolution.value * pixelSize.value) / previewSize)
    const scale = pixelSize.value / ((pixelResolution.value * pixelSize.value) / Number(imageSize.value))
    scaleCanvas(canvas, scale)
    renderPixel(canvas!)
    const link = document.createElement('a')
    link.href = canvas!.toDataURL()
    link.download = imageName.value + '.png'
    link.click()
    canvas!.width = previewSize
    canvas!.height = previewSize
    scaleCanvas(canvas, originalScale)
    renderPixel(canvas!)
  }
  const scaleCanvas = (canvas: HTMLCanvasElement | null, scaleRatio: number) => {
    const context = canvas!.getContext('2d')
    context!.scale(scaleRatio, scaleRatio)
    context!.imageSmoothingEnabled = false
  }
  return {
    imageName,
    imageSize,
    downloadImage,
  }
}
