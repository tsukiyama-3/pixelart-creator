<script setup lang="ts">
const canvas = ref();
const preview = ref();
const isClicked = ref(false);
const canvasSize = 656;
const previewSize = 158;
const pixelSize = ref(32);
const dotSize = ref(16);
const coords = ref();
const currentColor = ref("#ff0000");
const mode = ref("pen");
const visibleGrid = ref(false);
const pixels = ref();
const previousCol = ref(0);
const previousRow = ref(0);
const startCol = ref(null);
const startRow = ref(null);
const undoPixelsStates = ref([]);
const redoPixelsStates = ref([]);
const originalColor = ref<number | null>(null);
const originalCoords = ref<{ x: number; y: number } | null>(null);
const colorPallet = ref(["#ff0000"]);

const init = () => {
  const context = canvas.value.getContext("2d");
  context.imageSmoothingEnabled = false;
  context.scale(canvasSize / pixelSize.value, canvasSize / pixelSize.value);
  const previewContext = preview.value.getContext("2d");
  previewContext.imageSmoothingEnabled = false;
  const scale = (pixelSize.value * dotSize.value) / previewSize;
  previewContext.scale(dotSize.value / scale, dotSize.value / scale);
  // localStrage
  const storedPixels = localStorage.getItem("pixels");
  if (storedPixels) {
    pixels.value = new Uint32Array(JSON.parse(storedPixels));
    renderPixel();
    renderPreview();
  } else {
    pixels.value = new Uint32Array(pixelSize.value * pixelSize.value);
  }
  const imageData = uint32ArrayToImageData(
    pixels.value,
    pixelSize.value,
    pixelSize.value
  );
  undoPixelsStates.value.push(imageData);
};

onMounted(() => {
  init();
});

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
    undoPixelsStates.value.push(imageData);
    localStorage.setItem("pixels", JSON.stringify(Array.from(pixels.value)));
  }
  startCol.value = null;
  startRow.value = null;
  renderPreview();
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
  const canvasRect = canvas.value.getBoundingClientRect();
  return {
    x: Math.floor((x - canvasRect.left) / (canvasSize / pixelSize.value)),
    y: Math.floor((y - canvasRect.top) / (canvasSize / pixelSize.value)),
  };
};

const drawAt = (x: number, y: number) => {
  if (containsPixel(x, y)) {
    setPixelColor(x, y, colorToInt(currentColor.value));
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
        setPixelColor(pixle.col, pixle.row, colorToInt(currentColor.value));
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
    setPixelColor(x, y, colorToInt(currentColor.value));
    renderPixel();
  }
};

// ピクセルを描画する
const renderPixel = () => {
  // コンテキスト取得
  const context = canvas.value.getContext("2d");
  // offscreenCanvasを作成
  const offscreenCanvas = document.createElement("canvas");
  // コンテキスト取得
  const offscreenContext = offscreenCanvas.getContext("2d");
  // width height を設定
  offscreenCanvas.width = pixelSize.value;
  offscreenCanvas.height = pixelSize.value;
  // imageDataを作成(width・height・dataが入っている)
  const imageData = offscreenContext?.createImageData(
    pixelSize.value,
    pixelSize.value
  );
  // imageData.dataをimgDataDataに代入
  const imgDataData = imageData?.data;
  // pixels.value.bufferをUint8ClampedArrayの形式でdataに代入
  const data = new Uint8ClampedArray(pixels.value.buffer);
  // imgDataDataにdataをコピー
  imgDataData?.set(data);
  // imageDataをoffscreenContextに反映
  offscreenContext?.putImageData(imageData!, 0, 0);
  // コンテキストをクリアにする
  context.clearRect(0, 0, pixelSize.value, pixelSize.value);
  // 描画の状態をスタックに保存している
  context.save();
  // offscreenCanvasの内容をキャンバスコンテキストに描画している
  context.drawImage(offscreenCanvas, 0, 0);
  context.restore();
  // grid
  if (visibleGrid.value) {
    addGrid();
  }
  return offscreenCanvas;
};

const renderPreview = () => {
  const offscreenCanvas = renderPixel();
  // preview
  const previewContext = preview.value.getContext("2d");
  previewContext.clearRect(0, 0, pixelSize.value, pixelSize.value);
  previewContext.save();
  previewContext.drawImage(offscreenCanvas, 0, 0);
  previewContext.restore();
};

const undo = () => {
  if (undoPixelsStates.value.length > 1) {
    const previousState =
      undoPixelsStates.value[undoPixelsStates.value.length - 2];
    pixels.value = imageDataToUint32Array(previousState);
    originalColor.value = null;
    originalCoords.value = null;
    renderPixel();
    renderPreview();
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
    renderPreview();
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
  const link = document.createElement("a");
  link.href = canvas.value.toDataURL();
  link.download = "image.png";
  link.click();
  if (visibleGridState) {
    visibleGrid.value = true;
    renderPixel();
  }
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

  // Uint32Array のデータを ImageData のデータにコピーする
  for (let i = 0, j = 0; i < array.length; i++, j += 4) {
    const pixel = array[i];
    data![j] = pixel & 0xff; // Red コンポーネント
    data![j + 1] = (pixel >> 8) & 0xff; // Green コンポーネント
    data![j + 2] = (pixel >> 16) & 0xff; // Blue コンポーネント
    data![j + 3] = (pixel >> 24) & 0xff; // Alpha コンポーネント
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
    // Security loop breaker:
    if (loopCount.value > 10 * cellCount) {
      console.log("loop breaker called");
      break;
    }
  }
  return visitedPixels;
};

// ピクセルカラーを取得する
const getPixelColor = (x: number, y: number) => {
  if (containsPixel(x, y)) {
    return pixels.value[y * pixelSize.value + x];
  } else {
    return null;
  }
};

// ピクセルカラーを設定する
const setPixelColor = (x: number, y: number, color: number) => {
  if (containsPixel(x, y)) {
    const index = y * pixelSize.value + x;
    pixels.value[index] = color;
  }
};

// キャンバスないか判定する
const containsPixel = (col: number, row: number) => {
  if (col === null || row === null) {
    return false;
  }
  return col >= 0 && row >= 0 && col < pixelSize.value && row < pixelSize.value;
};

const addGrid = () => {
  // 既存のキャンバスに罫線を描画する関数
  const context = canvas.value.getContext("2d");
  context.strokeStyle = "rgba(0, 0, 0, 1)";
  context.lineWidth = 1 / 64;

  // 横の罫線を描画
  for (let x = 1; x < pixelSize.value; x += 1) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, pixelSize.value);
    context.stroke();
  }

  // 縦の罫線を描画
  for (let y = 1; y < pixelSize.value; y += 1) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(pixelSize.value, y);
    context.stroke();
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
  undoPixelsStates.value.push(imageData);
  localStorage.setItem("pixels", JSON.stringify(Array.from(pixels.value)));
  renderPixel();
};

const getLinePixels = (x0: number, x1: number, y0: number, y1: number) => {
  const pixels = [];
  // x1 = normalize(x1, 0);
  // y1 = normalize(y1, 0);
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

const colorToInt = (color: string, alpha: number = 255) => {
  const hex = color.replace("#", "");
  const red = parseInt(hex.substr(0, 2), 16);
  const green = parseInt(hex.substr(2, 2), 16);
  const blue = parseInt(hex.substr(4, 2), 16);
  const colorInt = ((alpha << 24) >>> 0) + (blue << 16) + (green << 8) + red;
  return colorInt;
};

const visibleModal = ref(false);
const pickedColor = ref("#000000");
const addColor = () => {
  visibleModal.value = true;
};
const saveColor = () => {
  if (pickedColor.value && !colorPallet.value.includes(pickedColor.value)) {
    colorPallet.value.push(pickedColor.value);
  }
  if (pickedColor.value) {
    currentColor.value = pickedColor.value;
  }
  visibleModal.value = false;
};

const changeSize = (number: number) => {
  pixelSize.value = number;
  dotSize.value = canvasSize / pixelSize.value;
  console.log(
    pixelSize.value,
    "pixelSize.value",
    dotSize.value,
    "dotSize.value"
  );
  clear();
  const context = canvas.value.getContext("2d");
  const initialTransform = context.getTransform();
  context.setTransform(initialTransform);
  const previewContext = preview.value.getContext("2d");
  previewContext.setTransform(initialTransform);
  init();
};

const saveDataToLocalStorage = (data) => {
  localStorage.setItem('undoPixelsStates', JSON.stringify(data));
}

// ローカルストレージからデータを読み込む関数
const loadDataFromLocalStorage = () => {
  const data = localStorage.getItem('undoPixelsStates');
  return data ? JSON.parse(data) : null;
}
</script>

<template>
  <div
    class="grow flex items-center justify-center"
    @mousemove="onCanvasMousemove"
    @mousedown="onCanvasMousedown"
    @mouseup="onCanvasMouseup"
    @mouseleave="onMouseleave"
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
              class="inline-flex rounded-md items-center justify-center w-12 h-12 border-2 border-solid border-[#2b2c34] cursor-pointer"
              :class="{ 'bg-[#2b2c34]': mode === 'pen' }"
            >
              <img
                src="~/assets/pencil.svg"
                width="32"
                height="32"
                alt="pen-icon"
              />
            </label>
            <label
              for="bucket"
              class="inline-flex rounded-md items-center justify-center w-12 h-12 border-2 border-solid border-[#2b2c34] cursor-pointer"
              :class="{ 'bg-[#2b2c34]': mode === 'bucket' }"
            >
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
                class="grid justify-center items-center w-12 h-12 rounded-md border-2 border-solid border-[#2b2c34] cursor-pointer"
                :class="{ 'bg-[#2b2c34]': visibleGrid }"
              >
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
        <div class="grid grid-cols-[repeat(8,minmax(48px,48px))] gap-2">
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
              class="content-[''] grid justify-center items-center w-12 h-12 rounded-md border-2 border-solid border-[#2b2c34] cursor-pointer"
              :style="{ backgroundColor: color }"
            >
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
          <input type="color" v-model="pickedColor" v-show="visibleModal" />
          <button
            v-if="visibleModal"
            @click="saveColor"
            class="grid justify-center items-center w-12 h-12 rounded-md border-2 border-solid border-[#2b2c34] cursor-pointer"
          >
            <img
              src="~/assets/done.svg"
              width="32"
              height="32"
              alt="pen-icon"
            />
          </button>
          <div v-else>
            <button
              @click="addColor"
              class="grid justify-center items-center w-12 h-12 rounded-md border-2 border-solid border-[#2b2c34] cursor-pointer"
            >
              <img
                src="~/assets/add.svg"
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
              @click="undo"
              :disabled="undoPixelsStates.length <= 1"
              class="grid justify-center items-center w-12 h-12 rounded-md border-2 border-solid border-[#2b2c34] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <img
                src="~/assets/arrow_back.svg"
                width="32"
                height="32"
                alt="pen-icon"
              />
            </button>
          </div>
          <div
            class="text-2xl font-bold text-[#2b2c34] grid justify-center items-center w-12 h-12 rounded-md border-2 border-solid border-[#2b2c34]"
          >
            <ClientOnly>
              {{ undoPixelsStates.length - 1 }}
            </ClientOnly>
          </div>
          <div>
            <button
              @click="redo"
              :disabled="redoPixelsStates.length <= 0"
              class="grid justify-center items-center w-12 h-12 rounded-md border-2 border-solid border-[#2b2c34] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <img
                src="~/assets/arrow_next.svg"
                width="32"
                height="32"
                alt="pen-icon"
              />
            </button>
          </div>
        </div>
        <!-- <div class="flex space-x-2">
          <div>
            <button
              @click="changeSize(64)"
              class="grid justify-center items-center w-12 h-12 rounded-md border-2 border-solid border-[#2b2c34] cursor-pointer"
            >
              <img
                src="~/assets/64x64.svg"
                width="40"
                height="40"
                alt="pen-icon"
              />
            </button>
          </div>
        </div> -->
        <div class="flex space-x-2">
          <div>
            <button
              @click="downloadImage"
              class="grid justify-center items-center w-12 h-12 rounded-md border-2 border-solid border-[#2b2c34] cursor-pointer"
            >
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
              @click="clear"
              class="grid justify-center items-center w-12 h-12 rounded-md border-2 border-solid border-[#2b2c34] cursor-pointer"
            >
              <img
                src="~/assets/remove.svg"
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
</template>

<style scoped>
.pen-cursor {
  cursor: url("assets/pencil-cursor.svg") 0 12, default;
}

.bucket-cursor {
  cursor: url("assets/fill-cursor.svg") 12 12, default;
}

input[type="color"] {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  display: block;
  margin: 0;
  width: 44px;
  height: 48px;
  padding: 0;
  background-color: transparent;
  border: none;
  cursor: pointer;
}

input[type="color"]::-webkit-color-swatch {
  border-radius: 50%;
  border: 2px solid #2b2c34;
}
</style>
