const currentColor = ref('#ff0000')
const colorPallet = ref<string[] | null>(['#ff0000'])

export const useColor = () => {
  const visibleColorPicker = ref(false)
  const pickedColor = ref('#ffffff')

  const addColor = () => {
    visibleColorPicker.value = true
  }

  const saveColor = () => {
    if (pickedColor.value && !colorPallet.value!.includes(pickedColor.value)) {
      colorPallet.value!.push(pickedColor.value)
      saveColorToLocalStorage(colorPallet.value!)
    }
    if (pickedColor.value) {
      currentColor.value = pickedColor.value
    }
    visibleColorPicker.value = false
  }

  const removeColor = (colorCode: string) => {
    const index = colorPallet.value!.indexOf(colorCode)
    if (index !== -1) {
      colorPallet.value!.splice(index, 1)
    }
    if (colorCode === currentColor.value) {
      currentColor.value = colorPallet.value![0]
    }
    saveColorToLocalStorage(colorPallet.value!)
  }

  const colorToInt = (color: string, alpha: number = 255) => {
    const hex = color.replace('#', '')
    const red = parseInt(hex.substr(0, 2), 16)
    const green = parseInt(hex.substr(2, 2), 16)
    const blue = parseInt(hex.substr(4, 2), 16)
    const colorInt = ((alpha << 24) >>> 0) + (blue << 16) + (green << 8) + red
    return colorInt
  }

  const hexToRgbString = (hex: string, a = 1) => {
    hex = hex.replace('#', '')

    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)

    return `rgba(${r}, ${g}, ${b}, ${a})`
  }

  const saveColorToLocalStorage = (colorPallet: string[]) => {
    localStorage.setItem('colorPallet', JSON.stringify(colorPallet))
  }

  return {
    currentColor,
    colorPallet,
    visibleColorPicker: readonly(visibleColorPicker),
    pickedColor,
    addColor,
    saveColor,
    removeColor,
    colorToInt,
    hexToRgbString,
  }
}
