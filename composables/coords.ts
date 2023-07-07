export const useCoord = () => {
  const coords = ref<{ x: number; y: number } | null>(null)
  const getRelativeCoordinates = (x: number, y: number, canvas: HTMLCanvasElement | null) => {
    const canvasRect = canvas!.getBoundingClientRect()
    return {
      x: Math.floor((x - canvasRect.left) / (656 / pixelResolution.value)),
      y: Math.floor((y - canvasRect.top) / (656 / pixelResolution.value)),
    }
  }

  return {
    coords,
    getRelativeCoordinates,
  }
}
