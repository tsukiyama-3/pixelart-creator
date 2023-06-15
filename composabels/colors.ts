export const useColor = () => {
  const currentColor = ref<string | null>(null);
  const colorPallet = ref<string[] | null>([]);
  const visibleColorPicker = ref(false);
  const pickedColor = ref("#000000");
  const addColor = () => {
    visibleColorPicker.value = true;
  };
  const saveColor = () => {
    if (pickedColor.value && !colorPallet.value!.includes(pickedColor.value)) {
      colorPallet.value!.push(pickedColor.value);
      saveColorToLocalStorage(colorPallet.value!);
    }
    if (pickedColor.value) {
      currentColor.value = pickedColor.value;
    }
    visibleColorPicker.value = false;
  };
  const removeColor = (colorCode: string) => {
    const index = colorPallet.value!.indexOf(colorCode);
    if (index !== -1) {
      colorPallet.value!.splice(index, 1);
    }
    if (colorCode === currentColor.value) {
      currentColor.value = colorPallet.value![0];
    }
    saveColorToLocalStorage(colorPallet.value!);
  };
  const saveColorToLocalStorage = (colorPallet: string[]) => {
    localStorage.setItem("colorPallet", JSON.stringify(colorPallet));
  };
  const loadColorFromLocalStorage = () => {
    const storedColorPallet = localStorage.getItem("colorPallet");
    return storedColorPallet ? JSON.parse(storedColorPallet) : [];
  };
  return {
    currentColor,
    colorPallet,
    visibleColorPicker: readonly(visibleColorPicker),
    pickedColor,
    addColor,
    saveColor,
    removeColor,
    loadColorFromLocalStorage,
  };
};

export const colorToInt = (color: string, alpha: number = 255) => {
  const hex = color.replace("#", "");
  const red = parseInt(hex.substr(0, 2), 16);
  const green = parseInt(hex.substr(2, 2), 16);
  const blue = parseInt(hex.substr(4, 2), 16);
  const colorInt = ((alpha << 24) >>> 0) + (blue << 16) + (green << 8) + red;
  return colorInt;
};
