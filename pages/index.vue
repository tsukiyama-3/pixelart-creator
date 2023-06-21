<script setup lang="ts">
import { useColor, colorToInt } from "~/composabels/colors";

const canvas = ref<HTMLCanvasElement | null>(null);
const preview = ref<HTMLCanvasElement | null>(null);
const isClicked = ref(false);
const canvasSize = ref(656);
const previewSize = ref(158);
const pixelSize = ref(32);
const dotSize = ref(16);
const coords = ref<{ x: number; y: number } | null>(null);
const mode = ref("pen");
const visibleGrid = ref(false);
const pixels = ref<Uint32Array | null>(null);
const previousCol = ref(0);
const previousRow = ref(0);
const startCol = ref<number | null>(null);
const startRow = ref<number | null>(null);
const undoPixelsStates = ref<ImageData[]>([]);
const redoPixelsStates = ref<ImageData[]>([]);
const originalColor = ref<number | null>(null);
const originalCoords = ref<{ x: number; y: number } | null>(null);
const visibleModal = ref(false);
const confirmCanvas = ref<HTMLCanvasElement | null>(null);
const imageSize = ref("256");
const imageName = ref("");

const {
  currentColor,
  colorPallet,
  visibleColorPicker,
  pickedColor,
  addColor,
  saveColor,
  removeColor,
  loadColorFromLocalStorage,
} = useColor();

const init = () => {
  if (localStorage.getItem("pixelSize")) {
    pixelSize.value = Number(localStorage.getItem("pixelSize"));
  }
  if (localStorage.getItem("dotSize")) {
    dotSize.value = Number(localStorage.getItem("dotSize"));
  }
  scaleCanvas();
  // localStrage
  const storedPixels = localStorage.getItem("pixels");
  if (storedPixels) {
    const previreContext = preview.value?.getContext("2d");
    pixels.value = new Uint32Array(JSON.parse(storedPixels));
    renderPreview(previreContext);
  } else {
    pixels.value = new Uint32Array(pixelSize.value * pixelSize.value);
  }
  const savedColorPallet = loadColorFromLocalStorage();
  if (savedColorPallet.length > 0) {
    colorPallet.value = savedColorPallet;
  } else {
    colorPallet.value = ["#ff0000"];
  }
  currentColor.value = colorPallet.value![0];
  const imageData = uint32ArrayToImageData(
    pixels.value,
    pixelSize.value,
    pixelSize.value
  );
  undoPixelsStates.value.push(imageData!);
};

onMounted(() => {
  init();
});

const scaleCanvas = () => {
  const context = canvas.value!.getContext("2d");
  context!.imageSmoothingEnabled = false;
  context!.scale(
    canvasSize.value / pixelSize.value,
    canvasSize.value / pixelSize.value
  );
  const previewContext = preview.value!.getContext("2d");
  previewContext!.imageSmoothingEnabled = false;
  const scale = (pixelSize.value * dotSize.value) / previewSize.value;
  previewContext!.scale(dotSize.value / scale, dotSize.value / scale);
  const confirmCanvasContext = confirmCanvas.value?.getContext("2d");
  confirmCanvasContext!.imageSmoothingEnabled = false;
  confirmCanvasContext!.scale(dotSize.value / scale, dotSize.value / scale);
};

const onCanvasMousemove = (event: MouseEvent) => {
  coords.value = getRelativeCoordinates(event.clientX, event.clientY);
  if (isClicked.value) {
    if (
      Math.abs(coords.value.x - previousCol.value) > 1 ||
      Math.abs(coords.value.y - previousRow.value) > 1
    ) {
      const interpolatedPixels = getLinePixels(
        coords.value.x,
        previousCol.value,
        coords.value.y,
        previousRow.value
      );
      for (let i = 0, l = interpolatedPixels.length; i < l; i++) {
        const coords = interpolatedPixels[i];
        drawAt(coords.col, coords.row);
      }
    } else {
      drawAt(coords.value.x, coords.value.y);
    }
    previousCol.value = coords.value.x;
    previousRow.value = coords.value.y;
  }
  hoverAt(coords.value.x, coords.value.y);
};

const onCanvasMousedown = (event: MouseEvent) => {
  isClicked.value = true;
  coords.value = getRelativeCoordinates(event.clientX, event.clientY);
  previousCol.value = coords.value.x;
  previousRow.value = coords.value.y;
  startCol.value = coords.value.x;
  startRow.value = coords.value.y;
  if (mode.value === "pen") {
    drawAt(coords.value.x, coords.value.y);
  } else if (mode.value === "bucket") {
    const startTime = performance.now();
    fillAt(coords.value.x, coords.value.y);
    const endTime = performance.now();
    console.log(`fill実行時間: ${endTime - startTime} ミリ秒`);
  }
  if (containsPixel(coords.value.x, coords.value.y)) {
    const originalPixelColor = getPixelColor(coords.value.x, coords.value.y);
    originalColor.value = originalPixelColor;
  }
};

const onCanvasMouseup = () => {
  isClicked.value = false;
  const imageData = uint32ArrayToImageData(
    pixels.value,
    pixelSize.value,
    pixelSize.value
  );
  if (containsPixel(startCol.value!, startRow.value!)) {
    undoPixelsStates.value.push(imageData!);
    localStorage.setItem("pixels", JSON.stringify(Array.from(pixels.value!)));
  }
  startCol.value = null;
  startRow.value = null;
  const previreContext = preview.value?.getContext("2d");
  renderPreview(previreContext);
};

const onMouseleave = () => {
  if (originalCoords.value) {
    // 元の色に戻す
    setPixelColor(
      originalCoords.value.x,
      originalCoords.value.y,
      originalColor.value!
    );
    renderPixel();
  }
  onCanvasMouseup();
};

// ピクセル座標を返す
const getRelativeCoordinates = (x: number, y: number) => {
  const canvasRect = canvas.value!.getBoundingClientRect();
  return {
    x: Math.floor((x - canvasRect.left) / (canvasSize.value / pixelSize.value)),
    y: Math.floor((y - canvasRect.top) / (canvasSize.value / pixelSize.value)),
  };
};

const drawAt = (x: number, y: number) => {
  if (containsPixel(x, y)) {
    setPixelColor(x, y, colorToInt(currentColor.value!));
    renderPixel();
    redoPixelsStates.value = [];
  }
};

const fillAt = (x: number, y: number) => {
  if (containsPixel(x, y)) {
    const startPixel = {
      col: x,
      row: y,
    };
    visitConnectedPixels(startPixel, (pixle: any) => {
      if (getPixelColor(pixle.col, pixle.row) === originalColor.value) {
        setPixelColor(pixle.col, pixle.row, colorToInt(currentColor.value!));
        return true;
      } else {
        return false;
      }
    });
    renderPixel();
    redoPixelsStates.value = [];
  }
};

const hoverAt = (x: number, y: number) => {
  if (originalCoords.value) {
    // 元の色に戻す
    setPixelColor(
      originalCoords.value.x,
      originalCoords.value.y,
      originalColor.value!
    );
    renderPixel();
  }
  if (containsPixel(x, y)) {
    // 新しい座標の色を変更する
    originalColor.value = getPixelColor(x, y);
    originalCoords.value = { x, y };
    setPixelColor(x, y, colorToInt(currentColor.value!));
    renderPixel();
  }
};

// ピクセルを描画する
const renderPixel = () => {
  const context = canvas.value!.getContext("2d");
  const offscreenCanvas = document.createElement("canvas");
  const offscreenContext = offscreenCanvas.getContext("2d");
  offscreenCanvas.width = pixelSize.value;
  offscreenCanvas.height = pixelSize.value;
  const imageData = offscreenContext?.createImageData(
    pixelSize.value,
    pixelSize.value
  );
  const imgDataData = imageData?.data;
  const data = new Uint8ClampedArray(pixels.value!.buffer);
  imgDataData?.set(data);
  offscreenContext?.putImageData(imageData!, 0, 0);
  context!.clearRect(0, 0, pixelSize.value, pixelSize.value);
  context!.save();
  context!.drawImage(offscreenCanvas, 0, 0);
  context!.restore();
  if (visibleGrid.value) {
    addGrid();
  }
  return offscreenCanvas;
};

const renderPreview = (
  context: CanvasRenderingContext2D | null | undefined
) => {
  const offscreenCanvas = renderPixel();
  context!.clearRect(0, 0, pixelSize.value, pixelSize.value);
  context!.save();
  context!.drawImage(offscreenCanvas, 0, 0);
  context!.restore();
};

const undo = () => {
  if (undoPixelsStates.value.length > 1) {
    const previousState =
      undoPixelsStates.value[undoPixelsStates.value.length - 2];
    pixels.value = imageDataToUint32Array(previousState);
    originalColor.value = null;
    originalCoords.value = null;
    renderPixel();
    const previreContext = preview.value?.getContext("2d");
    renderPreview(previreContext);
    redoPixelsStates.value.push(undoPixelsStates.value.pop()!);
  }
};

const redo = () => {
  if (redoPixelsStates.value.length > 0) {
    const nextState = redoPixelsStates.value.pop();
    pixels.value = imageDataToUint32Array(nextState!);
    originalColor.value = null;
    originalCoords.value = null;
    renderPixel();
    const previreContext = preview.value?.getContext("2d");
    renderPreview(previreContext);
    undoPixelsStates.value.push(nextState!);
    localStorage.setItem("pixels", JSON.stringify(Array.from(pixels.value)));
  }
};

const downloadImage = () => {
  const visibleGridState = visibleGrid.value;
  if (visibleGridState) {
    visibleGrid.value = false;
    renderPixel();
  }
  canvasSize.value = Number(imageSize.value);
  canvas.value!.width = Number(imageSize.value);
  canvas.value!.height = Number(imageSize.value);
  init();
  const link = document.createElement("a");
  link.href = canvas.value!.toDataURL();
  link.download = imageName.value + ".png";
  link.click();
  canvasSize.value = 656;
  canvas.value!.width = 656;
  canvas.value!.height = 656;
  init();
  if (visibleGridState) {
    visibleGrid.value = true;
    renderPixel();
  }
  visibleModal.value = false
};

const imageDataToUint32Array = (imageData: ImageData) => {
  const { width, height, data } = imageData;
  const pixelArray = new Uint32Array(width * height);

  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    const red = data[i];
    const green = data[i + 1];
    const blue = data[i + 2];
    const alpha = data[i + 3];
    const color = (alpha << 24) | (blue << 16) | (green << 8) | red;
    pixelArray[j] = color;
  }

  return pixelArray;
};

const uint32ArrayToImageData = (array, width: number, height: number) => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const imageData = context?.createImageData(width, height);
  const data = imageData?.data;

  for (let i = 0, j = 0; i < array.length; i++, j += 4) {
    const pixel = array[i];
    data![j] = pixel & 0xff;
    data![j + 1] = (pixel >> 8) & 0xff;
    data![j + 2] = (pixel >> 16) & 0xff;
    data![j + 3] = (pixel >> 24) & 0xff;
  }

  return imageData;
};

// 隣接するピクセルを取得する
const visitConnectedPixels = (pixel: any, pixelVisitor: any) => {
  const queue = [];
  const visitedPixels = [];
  const dy = [-1, 0, 1, 0];
  const dx = [0, 1, 0, -1];
  queue.push(pixel);
  visitedPixels.push(pixel);
  pixelVisitor(pixel);

  const loopCount = ref(0);
  const cellCount = pixelSize.value * pixelSize.value;
  while (queue.length > 0) {
    loopCount.value++;
    const currentItem: any = queue.pop();
    for (let i = 0; i < 4; i++) {
      const nextCol = currentItem.col + dx[i];
      const nextRow = currentItem.row + dy[i];
      try {
        const connectedPixel = { col: nextCol, row: nextRow };
        const isValid = pixelVisitor(connectedPixel);
        if (isValid) {
          queue.push(connectedPixel);
          visitedPixels.push(connectedPixel);
        }
      } catch (e) {
        // Frame out of bound exception.
      }
    }
    if (loopCount.value > 10 * cellCount) {
      console.log("loop breaker called");
      break;
    }
  }
  return visitedPixels;
};

const getPixelColor = (x: number, y: number) => {
  if (containsPixel(x, y)) {
    return pixels.value![y * pixelSize.value + x];
  } else {
    return null;
  }
};

const setPixelColor = (x: number, y: number, color: number) => {
  if (containsPixel(x, y)) {
    const index = y * pixelSize.value + x;
    pixels.value![index] = color;
  }
};

const containsPixel = (col: number, row: number) => {
  if (col === null || row === null) {
    return false;
  }
  return col >= 0 && row >= 0 && col < pixelSize.value && row < pixelSize.value;
};

const addGrid = () => {
  const context = canvas.value!.getContext("2d");
  context!.strokeStyle = "rgba(0, 0, 0, 1)";
  context!.lineWidth = 1 / 64;

  for (let x = 1; x < pixelSize.value; x += 1) {
    context!.beginPath();
    context!.moveTo(x, 0);
    context!.lineTo(x, pixelSize.value);
    context!.stroke();
  }

  for (let y = 1; y < pixelSize.value; y += 1) {
    context!.beginPath();
    context!.moveTo(0, y);
    context!.lineTo(pixelSize.value, y);
    context!.stroke();
  }
};

const toggleGrid = () => {
  visibleGrid.value = !visibleGrid.value;
  if (visibleGrid.value) {
    renderPixel();
  } else {
    renderPixel();
  }
};

const clear = () => {
  pixels.value = new Uint32Array(pixelSize.value * pixelSize.value);
  const imageData = uint32ArrayToImageData(
    pixels.value,
    pixelSize.value,
    pixelSize.value
  );
  undoPixelsStates.value.push(imageData!);
  localStorage.setItem("pixels", JSON.stringify(Array.from(pixels.value)));
  originalColor.value = null;
  originalCoords.value = null;
  renderPixel();
  const previreContext = preview.value?.getContext("2d");
  renderPreview(previreContext);
};

const getLinePixels = (x0: number, x1: number, y0: number, y1: number) => {
  const pixels = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  while (true) {
    pixels.push({ col: x0, row: y0 });
    if (x0 == x1 && y0 == y1) {
      break;
    }
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
  return pixels;
};

const changeSize = (number: number) => {
  const confirmed = window.confirm(
    `Do you want to change the canvas size to ${number}x${number}?`
  );
  if (!confirmed) {
    return;
  }
  const originalCanvasScale = canvasSize.value / pixelSize.value;
  const originalPreviewScale =
    dotSize.value / ((pixelSize.value * dotSize.value) / previewSize.value);
  pixelSize.value = number;
  dotSize.value = canvasSize.value / pixelSize.value;
  const context = canvas.value!.getContext("2d");
  context!.scale(1 / originalCanvasScale, 1 / originalCanvasScale);
  const previewContext = preview.value!.getContext("2d");
  previewContext!.scale(1 / originalPreviewScale, 1 / originalPreviewScale);
  localStorage.removeItem("pixels");
  localStorage.setItem("pixelSize", pixelSize.value.toString());
  localStorage.setItem("dotSize", dotSize.value.toString());
  init();
  undoPixelsStates.value = [];
  redoPixelsStates.value = [];
  clear();
};

const clearCanvas = () => {
  const confirmed = window.confirm("Do you want to clear the canvas?");
  if (!confirmed) {
    return;
  }
  clear();
};

const openDownloadModal = () => {
  visibleModal.value = true;
  const confirmCanvasContext = confirmCanvas.value?.getContext("2d");
  renderPreview(confirmCanvasContext);
};
</script>

<template>
  <div
    class="grow flex items-center justify-center outline-none"
    @mousemove="onCanvasMousemove"
    @mousedown="onCanvasMousedown"
    @mouseup="onCanvasMouseup"
    @mouseleave="onMouseleave"
    @keydown.g="toggleGrid"
    @keydown.p="mode = 'pen'"
    @keydown.b="mode = 'bucket'"
    @keydown.z="undo"
    @keydown.x="redo"
    tabindex="0"
  >
    <div class="grid grid-cols-[656px_auto] gap-8">
      <div>
        <div
          :class="{
            'pen-cursor': mode === 'pen',
            'bucket-cursor': mode === 'bucket',
          }"
        >
          <canvas
            ref="canvas"
            :width="canvasSize"
            :height="canvasSize"
            class="border border-solid border-[#2b2c34]"
          ></canvas>
        </div>
      </div>
      <div class="space-y-2">
        <canvas
          ref="preview"
          :width="previewSize"
          :height="previewSize"
          class="border border-solid border-[#2b2c34]"
        ></canvas>
        <div class="flex">
          <input
            type="radio"
            name="mode"
            value="pen"
            id="pen"
            class="hidden"
            v-model="mode"
          />
          <input
            type="radio"
            name="mode"
            value="bucket"
            id="bucket"
            class="hidden"
            v-model="mode"
          />
          <div class="flex space-x-2">
            <label
              for="pen"
              class="inline-flex rounded-md items-center justify-center w-12 h-12 border-2 border-solid border-[#2b2c34] cursor-pointer transition tooltip"
              :class="{ 'bg-[#2b2c34]': mode === 'pen' }"
            >
              <span class="tooltip-text">Pen (P)</span>
              <img
                src="~/assets/pencil.svg"
                width="32"
                height="32"
                alt="pen-icon"
              />
            </label>
            <label
              for="bucket"
              class="inline-flex rounded-md items-center justify-center w-12 h-12 border-2 border-solid border-[#2b2c34] cursor-pointer transition tooltip"
              :class="{ 'bg-[#2b2c34]': mode === 'bucket' }"
            >
              <span class="tooltip-text">Bucket (B)</span>
              <img
                src="~/assets/fill.svg"
                width="32"
                height="32"
                alt="bucket-icon"
                color="white"
              />
            </label>
            <div>
              <button
                @click="toggleGrid"
                class="grid justify-center items-center w-12 h-12 rounded-md border-2 border-solid border-[#2b2c34] cursor-pointer transition tooltip"
                :class="{ 'bg-[#2b2c34]': visibleGrid }"
              >
                <span class="tooltip-text">Grid (G)</span>
                <img
                  src="~/assets/grid.svg"
                  width="32"
                  height="32"
                  alt="pen-icon"
                />
              </button>
            </div>
          </div>
        </div>
        <div
          class="grid grid-cols-[repeat(8,minmax(48px,48px))] gap-2 max-h-[266px]"
          :class="{ 'overflow-x-visible overflow-y-scroll' : colorPallet!.length > 31 }"
        >
          <div v-for="color in colorPallet">
            <input
              type="radio"
              name="color"
              :id="color"
              :value="color"
              v-model="currentColor"
              class="hidden"
            />
            <label
              :for="color"
              class="content-[''] grid justify-center items-center w-12 h-12 rounded-md border-2 border-solid border-[#2b2c34] cursor-pointer relative color-label"
              :style="{ backgroundColor: color }"
            >
              <button
                v-show="colorPallet!.length > 1"
                class="color-delete-btn absolute w-5 h-5 leading-none bg-[#fffffe] rounded-full -top-2 -left-2 border-2 border-solid border-[#2b2c34]"
                @click="removeColor(color)"
              >
                <img
                  src="~/assets/remove.svg"
                  width="32"
                  height="32"
                  alt="pen-icon"
                />
              </button>
              <img
                v-if="color === currentColor && mode === 'pen'"
                src="~/assets/pencil.svg"
                width="32"
                height="32"
                alt="pen-icon"
              />
              <img
                v-else-if="color === currentColor && mode === 'bucket'"
                src="~/assets/fill.svg"
                width="32"
                height="32"
                alt="bucket-icon"
              />
            </label>
          </div>
          <div>
            <label
              v-if="!visibleColorPicker"
              for="color-picker"
              class="grid justify-center items-center w-12 h-12 rounded-md border-2 border-solid border-[#2b2c34] cursor-pointer tooltip"
            >
              <img
                src="~/assets/add.svg"
                width="32"
                height="32"
                alt="pen-icon"
              />
            </label>
            <button
              v-else
              @click="saveColor"
              class="grid justify-center items-center w-12 h-12 rounded-md border-2 border-solid border-[#2b2c34] cursor-pointer tooltip"
              :style="{ backgroundColor: pickedColor }"
            >
              <img
                src="~/assets/check.svg"
                width="32"
                height="32"
                alt="pen-icon"
              />
            </button>
            <input
              type="color"
              v-model="pickedColor"
              @click="addColor"
              class="absolute opacity-0"
              id="color-picker"
            />
          </div>
        </div>
        <div class="flex space-x-2">
          <div>
            <button
              @click="undo"
              :disabled="undoPixelsStates.length <= 1"
              class="grid justify-center items-center w-12 h-12 rounded-md border-2 border-solid border-[#2b2c34] cursor-pointer disabled:border-[#2b2c34]/30 disabled:cursor-not-allowed tooltip"
            >
              <span class="tooltip-text opacity-0">Undo (Z)</span>
              <img
                src="~/assets/arrow_back.svg"
                :class="{ 'opacity-30': undoPixelsStates.length <= 1 }"
                width="32"
                height="32"
                alt="pen-icon"
              />
            </button>
          </div>
          <div
            class="text-xl font-bold text-[#2b2c34] grid justify-center items-center w-12 h-12 rounded-md border-2 border-solid border-[#2b2c34]"
          >
            <ClientOnly>
              {{ undoPixelsStates.length - 1 }}
            </ClientOnly>
          </div>
          <div>
            <button
              @click="redo"
              :disabled="redoPixelsStates.length <= 0"
              class="grid justify-center items-center w-12 h-12 rounded-md border-2 border-solid border-[#2b2c34] cursor-pointer disabled:border-[#2b2c34]/30 disabled:cursor-not-allowed tooltip"
            >
              <span class="tooltip-text opacity-0">Redo (X)</span>
              <img
                src="~/assets/arrow_next.svg"
                :class="{ 'opacity-30': redoPixelsStates.length <= 0 }"
                width="32"
                height="32"
                alt="pen-icon"
              />
            </button>
          </div>
        </div>
        <div class="flex space-x-2">
          <div>
            <button
              @click="changeSize(64)"
              class="grid justify-center items-center w-12 h-12 rounded-md border-2 border-solid border-[#2b2c34] cursor-pointer transition"
              :class="{ 'bg-[#2b2c34]': pixelSize === 64 }"
            >
              <p
                class="text-xs font-bold text-[#2b2c34]"
                :class="{ 'text-[#fffffe]': pixelSize === 64 }"
              >
                64x64
              </p>
            </button>
          </div>
          <div>
            <button
              @click="changeSize(32)"
              class="grid justify-center items-center w-12 h-12 rounded-md border-2 border-solid border-[#2b2c34] cursor-pointer transition"
              :class="{ 'bg-[#2b2c34]': pixelSize === 32 }"
            >
              <p
                class="text-xs font-bold text-[#2b2c34]"
                :class="{ 'text-[#fffffe]': pixelSize === 32 }"
              >
                32x32
              </p>
            </button>
          </div>
          <div>
            <button
              @click="changeSize(16)"
              class="grid justify-center items-center w-12 h-12 rounded-md border-2 border-solid border-[#2b2c34] cursor-pointer transition"
              :class="{ 'bg-[#2b2c34]': pixelSize === 16 }"
            >
              <p
                class="text-xs font-bold text-[#2b2c34]"
                :class="{ 'text-[#fffffe]': pixelSize === 16 }"
              >
                16x16
              </p>
            </button>
          </div>
        </div>
        <div class="flex space-x-2">
          <div>
            <button
              @click="openDownloadModal"
              class="grid justify-center items-center w-12 h-12 rounded-md border-2 border-solid border-[#2b2c34] cursor-pointer tooltip"
            >
              <span class="tooltip-text opacity-0">Download</span>
              <img
                src="~/assets/download.svg"
                width="32"
                height="32"
                alt="pen-icon"
              />
            </button>
          </div>
          <div>
            <button
              @click="clearCanvas"
              class="grid justify-center items-center w-12 h-12 rounded-md border-2 border-solid border-[#2b2c34] cursor-pointer tooltip"
            >
              <span class="tooltip-text opacity-0">Clear Canvas</span>
              <img
                src="~/assets/clear.svg"
                width="32"
                height="32"
                alt="pen-icon"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <transition name="modal">
    <div
      v-show="visibleModal"
      class="fixed top-0 flex items-center justify-center h-full w-full z-10 bg-[#2b2c34]/60"
    >
      <input
        type="radio"
        name="size"
        value="128"
        id="size-sm"
        v-model="imageSize"
        class="hidden"
      />
      <input
        type="radio"
        name="size"
        value="256"
        id="size-md"
        v-model="imageSize"
        class="hidden"
      />
      <input
        type="radio"
        name="size"
        value="512"
        id="size-lg"
        v-model="imageSize"
        class="hidden"
      />
      <div
        class="inline-flex space-x-4 p-4 bg-[#fffffe] rounded-md box-shadow z-20"
      >
        <canvas
          ref="confirmCanvas"
          :width="previewSize"
          :height="previewSize"
          class="border border-solid border-[#2b2c34]"
        ></canvas>
        <div class="space-y-4">
          <div class="flex justify-end">
            <button @click="visibleModal = false">
              <img
                src="~/assets/close.svg"
                width="16"
                height="16"
                alt="pen-icon"
              />
            </button>
          </div>
          <div class="flex items-end space-x-2">
            <input
              type="text"
              class="border-2 border-solid border-[#2b2c34] rounded-md py-1 px-2 w-40"
              placeholder="Image Name"
              v-model="imageName"
            />
            <p class="text-sm font-bold mb-1">.png</p>
          </div>
          <div class="flex space-x-4">
            <div class="grid grid-cols-3 gap-x-2">
              <label
                for="size-sm"
                class="inline-flex rounded-md items-center justify-center w-12 h-12 border-2 border-solid border-[#2b2c34] cursor-pointer transition tooltip"
                :class="{ 'bg-[#2b2c34]': imageSize === '128' }"
              >
                <span class="tooltip-text opacity-0">Image Size 128px</span>
                <p
                  class="text-xs font-bold text-[#2b2c34]"
                  :class="{ 'text-[#fffffe]': imageSize === '128' }"
                >
                  128px
                </p>
              </label>
              <label
                for="size-md"
                class="inline-flex rounded-md items-center justify-center w-12 h-12 border-2 border-solid border-[#2b2c34] cursor-pointer transition tooltip"
                :class="{ 'bg-[#2b2c34]': imageSize === '256' }"
              >
                <span class="tooltip-text opacity-0">Image Size 256px</span>
                <p
                  class="text-xs font-bold text-[#2b2c34]"
                  :class="{ 'text-[#fffffe]': imageSize === '256' }"
                >
                  256px
                </p>
              </label>
              <label
                for="size-lg"
                class="inline-flex rounded-md items-center justify-center w-12 h-12 border-2 border-solid border-[#2b2c34] cursor-pointer transition tooltip"
                :class="{ 'bg-[#2b2c34]': imageSize === '512' }"
              >
                <span class="tooltip-text opacity-0">Image Size 512px</span>
                <p
                  class="text-xs font-bold text-[#2b2c34]"
                  :class="{ 'text-[#fffffe]': imageSize === '512' }"
                >
                  512px
                </p>
              </label>
            </div>
            <div>
              <button
                type="submit"
                @click="downloadImage"
                class="grid justify-center items-center w-12 h-12 rounded-md border-2 border-solid border-[#2b2c34] cursor-pointer tooltip disabled:border-[#2b2c34]/30 disabled:cursor-not-allowed"
                :disabled="imageName === ''"
              >
                <span class="tooltip-text opacity-0">Download</span>
                <img
                  src="~/assets/download.svg"
                  :class="{ 'opacity-30': imageName === '' }"
                  width="32"
                  height="32"
                  alt="pen-icon"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.pen-cursor {
  cursor: url("assets/pencil-cursor.svg") 0 12, default;
}

.bucket-cursor {
  cursor: url("assets/fill-cursor.svg") 12 12, default;
}

.color-picker {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  display: block;
  margin: -4px 0 0 -2px;
  width: 44px;
  height: 48px;
  padding: 0;
  background-color: transparent;
  border: none;
  cursor: pointer;
}

.color-picker::-webkit-color-swatch {
  border-radius: 6px;
  border: 2px solid #2b2c34;
  min-width: 44px;
  min-height: 44px;
  background-image: url("assets/add.svg");
}

.color-label:hover .color-delete-btn {
  display: block;
}

.color-delete-btn {
  display: none;
}

.tooltip {
  position: relative;
  cursor: pointer;
}

.tooltip-text {
  opacity: 0;
  visibility: hidden;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: -30px;
  display: inline-block;
  padding: 5px;
  white-space: nowrap;
  font-size: 0.8rem;
  line-height: 1.3;
  background: #2b2c34;
  color: #fff;
  border-radius: 3px;
  transition: 0.2s ease-in;
  z-index: 10;
}

.tooltip:hover .tooltip-text {
  opacity: 1;
  visibility: visible;
}

.transition {
  transition: 0.2s ease-in;
}

.box-shadow {
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
