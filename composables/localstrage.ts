export const useLocalstrage = () => {
  const loadPixels = (canvas: HTMLCanvasElement | null, previewCanvas: HTMLCanvasElement | null) => {
    const { renderPixel } = useRender()
    const storedPixels = localStorage.getItem('pixels')
    if (storedPixels) {
      pixels.value = new Uint32Array(JSON.parse(storedPixels))
      renderPixel(canvas!)
      renderPixel(previewCanvas!)
    }
  }

  const loadPixelResolution = () => {
    if (localStorage.getItem('pixelResolution')) {
      pixelResolution.value = Number(localStorage.getItem('pixelResolution'))
    }
  }

  const loadColorPallet = () => {
    const { currentColor, colorPallet } = useColor()
    const storedColorPallet = localStorage.getItem('colorPallet')
    colorPallet.value = storedColorPallet ? JSON.parse(storedColorPallet) : ['#ff0000']
    currentColor.value = colorPallet.value![0]
  }

  return {
    loadPixels,
    loadPixelResolution,
    loadColorPallet,
  }
}
