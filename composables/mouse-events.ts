export const useMouseEvent = () => {
  const { getLinePixels } = usePixel()

  const isClicked = ref(false)
  const previousCol = ref(0)
  const previousRow = ref(0)
  const strokeStart = ref<{ x: number; y: number }>({ x: 0, y: 0 })
  const strokeEnd = ref<{ x: number; y: number }>({ x: 0, y: 0 })

  const onMousemove = (event: MouseEvent, canvas: HTMLCanvasElement | null, hoverCanvas: HTMLCanvasElement | null) => {
    const { coords, getRelativeCoordinates } = useCoord()
    const { drawAt } = usePaintTool()
    const { hoverAt } = usePaintTool()

    coords.value = getRelativeCoordinates(event.clientX, event.clientY, canvas)

    if (mode.value === 'stroke' || mode.value === 'bucket') {
      hoverAt(coords.value.x, coords.value.y, hoverCanvas)
      return
    }

    if (isClicked.value) {
      if (Math.abs(coords.value.x - previousCol.value) > 1 || Math.abs(coords.value.y - previousRow.value) > 1) {
        const interpolatedPixels = getLinePixels(coords.value.x, previousCol.value, coords.value.y, previousRow.value)
        for (let i = 0, l = interpolatedPixels.length; i < l; i++) {
          const coords = interpolatedPixels[i]
          drawAt(coords.col, coords.row, canvas)
        }
      } else {
        drawAt(coords.value.x, coords.value.y, canvas)
      }
      previousCol.value = coords.value.x
      previousRow.value = coords.value.y
    }
    hoverAt(coords.value.x, coords.value.y, hoverCanvas)
  }

  const onMousedown = (event: MouseEvent, canvas: HTMLCanvasElement | null) => {
    const { coords, getRelativeCoordinates } = useCoord()
    const { drawAt, fillAt } = usePaintTool()

    isClicked.value = true
    coords.value = getRelativeCoordinates(event.clientX, event.clientY, canvas)
    previousCol.value = coords.value.x
    previousRow.value = coords.value.y
    strokeStart.value.x = coords.value.x
    strokeStart.value.y = coords.value.y

    if (mode.value === 'pen' || mode.value === 'eraser') {
      drawAt(coords.value.x, coords.value.y, canvas)
    } else if (mode.value === 'bucket') {
      const startTime = performance.now()
      fillAt(coords.value.x, coords.value.y, canvas)
      const endTime = performance.now()
      console.log(`fill実行時間: ${endTime - startTime} ミリ秒`)
    } else if (mode.value === 'stroke') {
      drawAt(coords.value.x, coords.value.y, canvas)
    }
  }

  const onMouseUp = (
    event: MouseEvent,
    canvas: HTMLCanvasElement | null,
    previewCanvas: HTMLCanvasElement | null,
    downloadCanvas: HTMLCanvasElement | null
  ) => {
    const { coords, getRelativeCoordinates } = useCoord()
    const { drawAt } = usePaintTool()

    isClicked.value = false
    coords.value = getRelativeCoordinates(event.clientX, event.clientY, canvas)

    if (mode.value === 'stroke') {
      strokeEnd.value!.x = coords.value.x
      strokeEnd.value!.y = coords.value.y
      const interpolatedPixels = getLinePixels(
        strokeStart.value.x,
        strokeEnd.value!.x,
        strokeStart.value.y,
        strokeEnd.value!.y
      )
      for (let i = 0; i < interpolatedPixels.length; i++) {
        const coords = interpolatedPixels[i]
        drawAt(coords.col, coords.row, canvas)
      }
    }

    // render
    const { renderPixel } = useRender()
    renderPixel(previewCanvas!)
    renderPixel(downloadCanvas!)

    // push undo state
    const { containsPixel } = usePixel()
    const { pushUndoState } = useHistory()
    if (containsPixel(strokeStart.value.x, strokeStart.value.y)) {
      pushUndoState()
      localStorage.setItem('pixels', JSON.stringify(Array.from(pixels.value!)))
    }
  }

  const onMouseleave = (
    event: MouseEvent,
    previewCanvas: HTMLCanvasElement | null,
    downloadCanvas: HTMLCanvasElement | null
  ) => {
    isClicked.value = false
    // push undo state
    const { containsPixel } = usePixel()
    const { pushUndoState } = useHistory()
    if (containsPixel(strokeStart.value.x, strokeStart.value.y)) {
      pushUndoState()
      localStorage.setItem('pixels', JSON.stringify(Array.from(pixels.value!)))
      // render
      const { renderPixel } = useRender()
      renderPixel(previewCanvas!)
      renderPixel(downloadCanvas!)
    }
  }

  return {
    onMousemove,
    onMousedown,
    onMouseUp,
    onMouseleave,
  }
}
