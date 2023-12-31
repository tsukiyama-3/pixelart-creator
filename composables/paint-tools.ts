export const mode = ref('pen')

export const usePaintTool = () => {
  const drawAt = (x: number, y: number, canvas: HTMLCanvasElement | null) => {
    const { containsPixel, setPixel } = usePixel()
    const { currentColor, colorToInt } = useColor()
    const { renderPixel } = useRender()
    if (containsPixel(x, y) && mode.value === 'eraser') {
      setPixel(x, y, 0)
    } else if (containsPixel(x, y) && mode.value !== 'eraser') {
      setPixel(x, y, colorToInt(currentColor.value))
    }
    if (containsPixel(x, y)) {
      renderPixel(canvas!)
      redoPixelsStates.value = []
    }
  }

  const fillAt = (x: number, y: number, canvas: HTMLCanvasElement | null) => {
    const { containsPixel, getPixel, setPixel, visitConnectedPixels } = usePixel()
    const { currentColor, colorToInt } = useColor()
    const { renderPixel } = useRender()

    if (containsPixel(x, y)) {
      const startPixel = {
        col: x,
        row: y,
      }
      const targetColor = getPixel(x, y)
      visitConnectedPixels(startPixel, (pixle: { col: number; row: number }) => {
        if (getPixel(pixle.col, pixle.row) === targetColor) {
          setPixel(pixle.col, pixle.row, colorToInt(currentColor.value))
          return true
        } else {
          return false
        }
      })
      renderPixel(canvas!)
    }
  }

  const hoverAt = (x: number, y: number, canvas: HTMLCanvasElement | null) => {
    const { containsPixel } = usePixel()
    const { currentColor, hexToRgbString } = useColor()

    const hoverContext = canvas!.getContext('2d')
    if (!hoverContext) return

    if (containsPixel(x, y) && mode.value === 'eraser') {
      hoverContext.clearRect(0, 0, canvasSize, canvasSize)
      hoverContext.fillStyle = hexToRgbString('#ffffff', 0.6)
      hoverContext.fillRect(x, y, 1, 1)
    } else if (containsPixel(x, y)) {
      hoverContext.clearRect(0, 0, canvasSize, canvasSize)
      hoverContext.fillStyle = hexToRgbString(currentColor.value, 0.6)
      hoverContext.fillRect(x, y, 1, 1)
    } else {
      hoverContext!.clearRect(0, 0, canvasSize, canvasSize)
    }
  }

  return {
    drawAt,
    fillAt,
    hoverAt,
  }
}
