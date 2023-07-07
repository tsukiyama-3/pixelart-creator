export const canvasSize = 656
export const previewSize = 158

export const useCanvas = () => {
  const canvas = ref<HTMLCanvasElement | null>(null)
  const backgroundCanvas = ref<HTMLCanvasElement | null>(null)
  const gridCanvas = ref<HTMLCanvasElement | null>(null)
  const hoverCanvas = ref<HTMLCanvasElement | null>(null)
  const previewCanvas = ref<HTMLCanvasElement | null>(null)
  const downloadCanvas = ref<HTMLCanvasElement | null>(null)

  const init = () => {
    const { renderGrid } = useRender()

    // canvas
    scaleCanvas(canvas!, canvasSize / pixelResolution.value)

    // grid canvas
    scaleCanvas(gridCanvas!, canvasSize / pixelResolution.value)
    renderGrid(gridCanvas.value)

    // hover canvas
    scaleCanvas(hoverCanvas!, canvasSize / pixelResolution.value)

    // preview canvas
    const scale = pixelSize.value / ((pixelResolution.value * pixelSize.value) / previewSize)
    scaleCanvas(previewCanvas!, scale)

    // downloadCanvas
    scaleCanvas(downloadCanvas!, scale)
  }

  const initBackground = () => {
    const { renderBackground } = useRender()

    // background canvas
    scaleCanvas(backgroundCanvas, canvasSize / pixelResolution.value / 2)
    renderBackground(backgroundCanvas)
  }

  const clear = (canvas: HTMLCanvasElement | null, previewCanvas: HTMLCanvasElement | null) => {
    const { renderPixel } = useRender()
    const { pushUndoState } = useHistory()
    const context = canvas!.getContext('2d')
    context!.clearRect(0, 0, canvasSize, canvasSize)
    pixels.value = new Uint32Array(pixelResolution.value * pixelResolution.value)
    pushUndoState()
    localStorage.setItem('pixels', JSON.stringify(Array.from(pixels.value)))
    renderPixel(previewCanvas!)
  }

  const changeSize = (size: number) => {
    const confirmed = window.confirm(`Do you want to change the canvas size to ${size}x${size}?`)
    if (!confirmed) {
      return
    }

    // canvas
    scaleCanvas(canvas, 1 / (canvasSize / pixelResolution.value))

    // preview canvas
    const originalPreviewScale = pixelSize.value / ((pixelResolution.value * pixelSize.value) / previewSize)
    scaleCanvas(previewCanvas, 1 / originalPreviewScale)

    // download canvas
    scaleCanvas(downloadCanvas, 1 / originalPreviewScale)

    // hover canvas
    scaleCanvas(hoverCanvas, 1 / (canvasSize / pixelResolution.value))

    // grid canvas
    scaleCanvas(gridCanvas, 1 / (canvasSize / pixelResolution.value))
    const gridContext = gridCanvas.value?.getContext('2d')
    gridContext!.clearRect(0, 0, canvasSize, canvasSize)

    pixelResolution.value = size
    pixelSize.value = canvasSize / pixelResolution.value

    localStorage.removeItem('pixels')
    localStorage.setItem('pixelResolution', pixelResolution.value.toString())

    init()

    undoPixelsStates.value = []
    redoPixelsStates.value = []

    pixels.value = new Uint32Array(pixelResolution.value * pixelResolution.value)
    clear(canvas.value, previewCanvas.value)
  }

  const scaleCanvas = (canvas: Ref<HTMLCanvasElement | null>, scaleRatio: number) => {
    const context = canvas.value!.getContext('2d')
    context!.scale(scaleRatio, scaleRatio)
    context!.imageSmoothingEnabled = false
  }

  return {
    canvas,
    gridCanvas,
    backgroundCanvas,
    hoverCanvas,
    previewCanvas,
    downloadCanvas,
    canvasSize,
    init,
    initBackground,
    clear,
    changeSize,
    scaleCanvas,
  }
}
