export const useRender = () => {
  const renderPixel = (canvas: HTMLCanvasElement) => {
    const context = canvas!.getContext('2d')
    const offscreenCanvas = document.createElement('canvas')
    const offscreenContext = offscreenCanvas.getContext('2d')
    offscreenCanvas.width = pixelResolution.value
    offscreenCanvas.height = pixelResolution.value
    const imageData = offscreenContext?.createImageData(pixelResolution.value, pixelResolution.value)
    const imgDataData = imageData?.data
    const data = new Uint8ClampedArray(pixels.value!.buffer)
    imgDataData?.set(data)
    offscreenContext?.putImageData(imageData!, 0, 0)
    context!.clearRect(0, 0, pixelResolution.value, pixelResolution.value)
    context!.save()
    context!.drawImage(offscreenCanvas, 0, 0)
    context!.restore()
  }

  const renderGrid = (canvas: HTMLCanvasElement | null) => {
    const { visible } = useGrid()
    const context = canvas?.getContext('2d')

    if (!visible.value) {
      context!.clearRect(0, 0, canvasSize, canvasSize)
      return
    }

    context!.strokeStyle = 'rgba(0, 0, 0, 1)'
    context!.lineWidth = 1 / pixelResolution.value

    for (let x = 1; x < pixelResolution.value; x += 1) {
      context!.beginPath()
      context!.moveTo(x, 0)
      context!.lineTo(x, pixelResolution.value)
      context!.stroke()
    }

    for (let y = 1; y < pixelResolution.value; y += 1) {
      context!.beginPath()
      context!.moveTo(0, y)
      context!.lineTo(pixelResolution.value, y)
      context!.stroke()
    }
  }

  const renderBackground = (canvas: Ref<HTMLCanvasElement | null>) => {
    const context = canvas.value!.getContext('2d')

    // パターンを作成
    const patternSize = 2 // パターンのサイズ
    const patternCanvas = document.createElement('canvas')
    patternCanvas.width = patternSize
    patternCanvas.height = patternSize
    const patternContext = patternCanvas.getContext('2d')

    patternContext!.fillStyle = 'rgba(255, 255, 255, 0.1)' // 白色
    patternContext!.fillRect(0, 0, patternSize, patternSize)

    patternContext!.fillStyle = 'rgba(0, 0, 0, 0.08' // 黒色
    patternContext!.fillRect(0, 0, patternSize / 2, patternSize / 2)
    patternContext!.fillRect(patternSize / 2, patternSize / 2, patternSize / 2, patternSize / 2)

    const pattern = context!.createPattern(patternCanvas, 'repeat')
    context!.fillStyle = pattern
    context!.fillRect(0, 0, canvas.value!.width, canvas.value!.height)
  }

  return {
    renderPixel,
    renderGrid,
    renderBackground,
  }
}
