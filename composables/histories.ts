export const undoPixelsStates = ref<ImageData[]>([])
export const redoPixelsStates = ref<ImageData[]>([])

export const useHistory = () => {
  const undo = (canvas: HTMLCanvasElement | null, previewCanvas: HTMLCanvasElement | null) => {
    const { renderPixel } = useRender()

    if (undoPixelsStates.value.length > 1) {
      const previousState = undoPixelsStates.value[undoPixelsStates.value.length - 2]
      pixels.value = imageDataToUint32Array(previousState)
      renderPixel(canvas!)
      renderPixel(previewCanvas!)
      redoPixelsStates.value.push(undoPixelsStates.value.pop()!)
    }
  }

  const redo = (canvas: HTMLCanvasElement | null, previewCanvas: HTMLCanvasElement | null) => {
    const { renderPixel } = useRender()

    if (redoPixelsStates.value.length > 0) {
      const nextState = redoPixelsStates.value.pop()
      pixels.value = imageDataToUint32Array(nextState!)
      renderPixel(canvas!)
      renderPixel(previewCanvas!)
      undoPixelsStates.value.push(nextState!)
      localStorage.setItem('pixels', JSON.stringify(Array.from(pixels.value)))
    }
  }

  const pushUndoState = () => {
    const imageData = uint32ArrayToImageData(pixels.value, pixelResolution.value, pixelResolution.value)
    undoPixelsStates.value.push(imageData!)
  }

  return {
    undo,
    redo,
    pushUndoState,
  }
}

export const uint32ArrayToImageData = (array: Uint32Array | null, width: number, height: number) => {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  const imageData = context?.createImageData(width, height)
  const data = imageData?.data

  for (let i = 0, j = 0; i < array!.length; i++, j += 4) {
    const pixel = array![i]
    data![j] = pixel & 0xff
    data![j + 1] = (pixel >> 8) & 0xff
    data![j + 2] = (pixel >> 16) & 0xff
    data![j + 3] = (pixel >> 24) & 0xff
  }

  return imageData
}

export const imageDataToUint32Array = (imageData: ImageData) => {
  const { width, height, data } = imageData
  const pixelArray = new Uint32Array(width * height)

  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    const red = data[i]
    const green = data[i + 1]
    const blue = data[i + 2]
    const alpha = data[i + 3]
    const color = (alpha << 24) | (blue << 16) | (green << 8) | red
    pixelArray[j] = color
  }

  return pixelArray
}
