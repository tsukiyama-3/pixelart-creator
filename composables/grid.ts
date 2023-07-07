const visible = ref(true)

export const useGrid = () => {
  const toggle = (canvas: HTMLCanvasElement | null) => {
    const { renderGrid } = useRender()
    visible.value = !visible.value
    renderGrid(canvas)
  }
  return {
    visible: readonly(visible),
    toggle,
  }
}
