<script setup lang="ts">
import { useCanvas, previewSize } from '../composables/canvas'
import { useMouseEvent } from '../composables/mouse-events'
import { useHistory, undoPixelsStates, redoPixelsStates } from '../composables/histories'
import { useLocalstrage } from '../composables/localstrage'
import { mode } from '../composables/paint-tools'
import { useColor } from '../composables/colors'
import { useGrid } from '../composables/grid'
import { useModal } from '../composables/modal'
import { useImage } from '../composables/images'
import { pixelResolution } from '../composables/pixels'

const colorMode = useColorMode()
const {
  canvas,
  backgroundCanvas,
  gridCanvas,
  hoverCanvas,
  previewCanvas,
  downloadCanvas,
  canvasSize,
  init,
  initBackground,
  clear,
  changeSize,
} = useCanvas()
const { undo, redo, pushUndoState } = useHistory()
const { onMousemove, onMousedown, onMouseUp, onMouseleave } = useMouseEvent()
const { loadPixels, loadPixelResolution, loadColorPallet } = useLocalstrage()
const { visible: visibleGrid, toggle } = useGrid()
const { currentColor, colorPallet, visibleColorPicker, pickedColor, addColor, saveColor, removeColor } = useColor()
const { visible: visibleModal, show, dismiss } = useModal()
const { imageName, imageSize, downloadImage } = useImage()

onMounted(() => {
  initBackground()
  loadPixelResolution()
  init()
  loadPixels(canvas.value, previewCanvas.value)
  loadColorPallet()
  pushUndoState()
})
</script>

<template>
  <div
    class="flex grow items-center justify-center outline-none"
    @mousemove="onMousemove($event, canvas, hoverCanvas)"
    @mousedown="onMousedown($event, canvas)"
    @mouseup="onMouseUp($event, canvas, previewCanvas, downloadCanvas)"
    @mouseleave="onMouseleave($event, previewCanvas, downloadCanvas)"
  >
    <div class="grid grid-cols-[656px_auto] gap-8">
      <!-- editor -->
      <div>
        <div
          :class="{
            'pen-cursor': mode === 'pen',
            'bucket-cursor': mode === 'bucket',
            'stroke-cursor': mode === 'stroke',
          }"
        >
          <div class="relative h-[656px] w-[656px]">
            <canvas
              data="backgroundCanvas"
              ref="backgroundCanvas"
              class="absolute border border-solid border-[#2b2c34] dark:border-[#2cb67d]"
              :width="canvasSize"
              :height="canvasSize"
            ></canvas>
            <canvas
              data="canvas"
              ref="canvas"
              class="absolute border border-solid border-[#2b2c34] dark:border-[#2cb67d]"
              :width="canvasSize"
              :height="canvasSize"
            ></canvas>
            <canvas
              data="hoverCanvas"
              ref="hoverCanvas"
              class="absolute border border-solid border-[#2b2c34] dark:border-[#2cb67d]"
              :width="canvasSize"
              :height="canvasSize"
            ></canvas>
            <canvas
              data="gridCanvas"
              ref="gridCanvas"
              class="absolute border border-solid border-[#2b2c34] dark:border-[#2cb67d]"
              :width="canvasSize"
              :height="canvasSize"
            ></canvas>
          </div>
        </div>
      </div>
      <!-- tools -->
      <div class="space-y-2">
        <!-- preview -->
        <canvas
          data="previewCanvas"
          ref="previewCanvas"
          :width="previewSize"
          :height="previewSize"
          class="border border-solid border-[#2b2c34] dark:border-[#2cb67d]"
        ></canvas>
        <!-- mode -->
        <div class="flex">
          <input type="radio" name="mode" value="pen" id="pen" class="hidden" v-model="mode" />
          <input type="radio" name="mode" value="bucket" id="bucket" class="hidden" v-model="mode" />
          <input type="radio" name="mode" value="stroke" id="stroke" class="hidden" v-model="mode" />
          <div class="flex space-x-2">
            <label
              for="pen"
              class="tooltip inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-md border-2 border-solid border-[#2b2c34] transition dark:border-[#2cb67d]"
              :class="{ 'bg-[#2b2c34] dark:bg-[#2cb67d]': mode === 'pen' }"
            >
              <span class="tooltip-text">Pen (P)</span>
              <img
                v-if="colorMode.preference === 'light' && mode !== 'pen'"
                src="~/assets/pencil.svg"
                width="32"
                height="32"
                alt="pen-icon"
              />
              <img
                v-else-if="colorMode.preference === 'light' && mode === 'pen'"
                src="~/assets/pencil_light.svg"
                width="32"
                height="32"
                alt="pen-icon"
              />
              <img
                v-else-if="colorMode.preference === 'dark' && mode !== 'pen'"
                src="~/assets/dark/pencil_dark.svg"
                width="32"
                height="32"
                alt="pen-icon"
              />
              <img
                v-else-if="colorMode.preference === 'dark' && mode === 'pen'"
                src="~/assets/dark/pencil_active.svg"
                width="32"
                height="32"
                alt="pen-icon"
              />
            </label>
            <label
              for="bucket"
              class="tooltip inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-md border-2 border-solid border-[#2b2c34] transition dark:border-[#2cb67d]"
              :class="{ 'bg-[#2b2c34] dark:bg-[#2cb67d]': mode === 'bucket' }"
            >
              <span class="tooltip-text">Bucket (B)</span>
              <img
                v-if="colorMode.preference === 'light' && mode !== 'bucket'"
                src="~/assets/fill.svg"
                width="32"
                height="32"
                alt="bucket-icon"
                color="white"
              />
              <img
                v-else-if="colorMode.preference === 'light' && mode === 'bucket'"
                src="~/assets/fill_light.svg"
                width="32"
                height="32"
                alt="bucket-icon"
                color="white"
              />
              <img
                v-else-if="colorMode.preference === 'dark' && mode !== 'bucket'"
                src="~/assets/dark/fill_dark.svg"
                width="32"
                height="32"
                alt="bucket-icon"
                color="white"
              />
              <img
                v-else-if="colorMode.preference === 'dark' && mode === 'bucket'"
                src="~/assets/dark/fill_active.svg"
                width="32"
                height="32"
                alt="bucket-icon"
                color="white"
              />
            </label>
            <label
              for="stroke"
              class="tooltip inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-md border-2 border-solid border-[#2b2c34] transition dark:border-[#2cb67d]"
              :class="{ 'bg-[#2b2c34] dark:bg-[#2cb67d]': mode === 'stroke' }"
            >
              <span class="tooltip-text">Stroke (Shift)</span>
              <img
                v-if="colorMode.preference === 'light' && mode !== 'stroke'"
                src="~/assets/stroke.svg"
                width="32"
                height="32"
                alt="stroke-icon"
                color="white"
              />
              <img
                v-if="colorMode.preference === 'light' && mode === 'stroke'"
                src="~/assets/stroke_light.svg"
                width="32"
                height="32"
                alt="stroke-icon"
                color="white"
              />
              <img
                v-else-if="colorMode.preference === 'dark' && mode !== 'stroke'"
                src="~/assets/dark/stroke_dark.svg"
                width="32"
                height="32"
                alt="stroke-icon"
                color="white"
              />
              <img
                v-else-if="colorMode.preference === 'dark' && mode === 'stroke'"
                src="~/assets/dark/stroke_active.svg"
                width="32"
                height="32"
                alt="stroke-icon"
                color="white"
              />
            </label>
            <div>
              <button
                @click="toggle(gridCanvas)"
                class="tooltip grid h-12 w-12 cursor-pointer items-center justify-center rounded-md border-2 border-solid border-[#2b2c34] transition dark:border-[#2cb67d]"
                :class="{ 'bg-[#2b2c34] dark:bg-[#2cb67d]': visibleGrid }"
              >
                <span class="tooltip-text">Grid (G)</span>
                <img
                  v-if="colorMode.preference === 'light' && !visibleGrid"
                  src="~/assets/grid.svg"
                  width="32"
                  height="32"
                  alt="pen-icon"
                />
                <img
                  v-if="colorMode.preference === 'light' && visibleGrid"
                  src="~/assets/grid_light.svg"
                  width="32"
                  height="32"
                  alt="pen-icon"
                />
                <img
                  v-else-if="colorMode.preference === 'dark' && !visibleGrid"
                  src="~/assets/dark/grid_dark.svg"
                  width="32"
                  height="32"
                  alt="pen-icon"
                />
                <img
                  v-else-if="colorMode.preference === 'dark' && visibleGrid"
                  src="~/assets/dark/grid_active.svg"
                  width="32"
                  height="32"
                  alt="pen-icon"
                />
              </button>
            </div>
          </div>
        </div>
        <!-- color -->
        <div
          class="grid max-h-[266px] grid-cols-[repeat(8,minmax(48px,48px))] gap-2"
          :class="{ 'overflow-x-visible overflow-y-scroll' : colorPallet!.length > 31 }"
        >
          <div v-for="color in colorPallet">
            <input type="radio" name="color" :id="color" :value="color" v-model="currentColor" class="hidden" />
            <label
              :for="color"
              class="color-label relative grid h-12 w-12 cursor-pointer items-center justify-center rounded-md border-2 border-solid border-[#2b2c34] content-[''] dark:border-[#2cb67d]"
              :style="{ backgroundColor: color }"
            >
              <button
                v-show="colorPallet!.length > 1"
                class="color-delete-btn absolute -left-2 -top-2 h-5 w-5 rounded-full border-2 border-solid border-[#2b2c34] bg-[#fffffe] leading-none dark:border-[#2cb67d] dark:bg-[#16161a]"
                @click="removeColor(color)"
              >
                <img
                  v-if="colorMode.preference === 'light'"
                  src="~/assets/remove.svg"
                  width="32"
                  height="32"
                  alt="pen-icon"
                />
                <img
                  v-else-if="colorMode.preference === 'dark'"
                  src="~/assets/dark/remove_dark.svg"
                  width="32"
                  height="32"
                  alt="pen-icon"
                />
              </button>
              <img
                v-if="color === currentColor && mode === 'pen' && colorMode.preference === 'light'"
                src="~/assets/pencil.svg"
                width="32"
                height="32"
                alt="pen-icon"
              />
              <img
                v-else-if="color === currentColor && mode === 'bucket' && colorMode.preference === 'light'"
                src="~/assets/fill.svg"
                width="32"
                height="32"
                alt="bucket-icon"
              />
              <img
                v-else-if="color === currentColor && mode === 'stroke' && colorMode.preference === 'light'"
                src="~/assets/stroke.svg"
                width="32"
                height="32"
                alt="stroke-icon"
                color="white"
              />
              <img
                v-else-if="color === currentColor && mode === 'pen' && colorMode.preference === 'dark'"
                src="~/assets/dark/pencil_active.svg"
                width="32"
                height="32"
                alt="pen-icon"
              />
              <img
                v-else-if="color === currentColor && mode === 'bucket' && colorMode.preference === 'dark'"
                src="~/assets/dark/fill_active.svg"
                width="32"
                height="32"
                alt="bucket-icon"
              />
              <img
                v-else-if="color === currentColor && mode === 'stroke' && colorMode.preference === 'dark'"
                src="~/assets/dark/stroke_active.svg"
                width="32"
                height="32"
                alt="stroke-icon"
                color="white"
              />
            </label>
          </div>
          <div>
            <label
              v-if="!visibleColorPicker"
              for="color-picker"
              class="tooltip grid h-12 w-12 cursor-pointer items-center justify-center rounded-md border-2 border-solid border-[#2b2c34] dark:border-[#2cb67d]"
            >
              <img
                v-if="colorMode.preference === 'light'"
                src="~/assets/add.svg"
                width="32"
                height="32"
                alt="pen-icon"
              />
              <img
                v-if="colorMode.preference === 'dark'"
                src="~/assets/dark/add_dark.svg"
                width="32"
                height="32"
                alt="pen-icon"
              />
            </label>
            <button
              v-else
              @click="saveColor"
              class="tooltip grid h-12 w-12 cursor-pointer items-center justify-center rounded-md border-2 border-solid border-[#2b2c34] dark:border-[#2cb67d]"
              :style="{ backgroundColor: pickedColor }"
            >
              <img
                v-if="colorMode.preference === 'light'"
                src="~/assets/check.svg"
                width="32"
                height="32"
                alt="pen-icon"
              />
              <img
                v-if="colorMode.preference === 'dark'"
                src="~/assets/dark/check_dark.svg"
                width="32"
                height="32"
                alt="pen-icon"
              />
            </button>
            <input type="color" v-model="pickedColor" @click="addColor" class="absolute opacity-0" id="color-picker" />
          </div>
        </div>
        <!-- histories -->
        <div class="flex space-x-2">
          <div>
            <button
              @click="undo(canvas, previewCanvas)"
              :disabled="undoPixelsStates.length <= 1"
              class="tooltip grid h-12 w-12 cursor-pointer items-center justify-center rounded-md border-2 border-solid border-[#2b2c34] disabled:cursor-not-allowed disabled:border-[#2b2c34]/30 dark:border-[#2cb67d] dark:disabled:border-[#2cb67d]/30"
            >
              <span class="tooltip-text opacity-0">Undo (Z)</span>
              <img
                v-if="colorMode.preference === 'light'"
                src="~/assets/arrow_back.svg"
                :class="{ 'opacity-30': undoPixelsStates.length <= 1 }"
                width="32"
                height="32"
                alt="pen-icon"
              />
              <img
                v-else-if="colorMode.preference === 'dark'"
                src="~/assets/dark/arrow_back_dark.svg"
                :class="{ 'opacity-30': undoPixelsStates.length <= 1 }"
                width="32"
                height="32"
                alt="pen-icon"
              />
            </button>
          </div>
          <div
            class="grid h-12 w-12 items-center justify-center rounded-md border-2 border-solid border-[#2b2c34] text-xl font-bold text-[#2b2c34] dark:border-[#2cb67d] dark:text-[#2cb67d]"
          >
            <ClientOnly>
              {{ undoPixelsStates.length - 1 }}
            </ClientOnly>
          </div>
          <div>
            <button
              @click="redo(canvas, previewCanvas)"
              :disabled="redoPixelsStates.length <= 0"
              class="tooltip grid h-12 w-12 cursor-pointer items-center justify-center rounded-md border-2 border-solid border-[#2b2c34] disabled:cursor-not-allowed disabled:border-[#2b2c34]/30 dark:border-[#2cb67d] disabled:dark:border-[#2cb67d]/30"
            >
              <span class="tooltip-text opacity-0">Redo (X)</span>
              <img
                v-if="colorMode.preference === 'light'"
                src="~/assets/arrow_next.svg"
                :class="{ 'opacity-30': redoPixelsStates.length <= 0 }"
                width="32"
                height="32"
                alt="pen-icon"
              />
              <img
                v-else-if="colorMode.preference === 'dark'"
                src="~/assets/dark/arrow_next_dark.svg"
                :class="{ 'opacity-30': redoPixelsStates.length <= 0 }"
                width="32"
                height="32"
                alt="pen-icon"
              />
            </button>
          </div>
        </div>
        <!-- size -->
        <div class="flex space-x-2">
          <div>
            <button
              @click="changeSize(64)"
              class="grid h-12 w-12 cursor-pointer items-center justify-center rounded-md border-2 border-solid border-[#2b2c34] transition dark:border-[#2cb67d]"
              :class="{ 'bg-[#2b2c34] dark:bg-[#2cb67d]': pixelResolution === 64 }"
            >
              <p
                class="text-xs font-bold text-[#2b2c34]"
                :class="{
                  'dark:text-[#2b2c34]':
                    (colorMode.preference === 'light' && pixelResolution !== 64) ||
                    (pixelResolution === 64 && colorMode.preference === 'dark'),
                  'dark:text-[#2cb67d]': colorMode.preference === 'dark' && pixelResolution !== 64,
                  'text-[#fffffe]': pixelResolution === 64 && colorMode.preference === 'light',
                }"
              >
                64x64
              </p>
            </button>
          </div>
          <div>
            <button
              @click="changeSize(32)"
              class="grid h-12 w-12 cursor-pointer items-center justify-center rounded-md border-2 border-solid border-[#2b2c34] transition dark:border-[#2cb67d]"
              :class="{ 'bg-[#2b2c34] dark:bg-[#2cb67d]': pixelResolution === 32 }"
            >
              <p
                class="text-xs font-bold text-[#2b2c34]"
                :class="{
                  'dark:text-[#2b2c34]':
                    (colorMode.preference === 'light' && pixelResolution !== 32) ||
                    (pixelResolution === 32 && colorMode.preference === 'dark'),
                  'dark:text-[#2cb67d]': colorMode.preference === 'dark' && pixelResolution !== 32,
                  'text-[#fffffe]': pixelResolution === 32 && colorMode.preference === 'light',
                }"
              >
                32x32
              </p>
            </button>
          </div>
          <div>
            <button
              @click="changeSize(16)"
              class="grid h-12 w-12 cursor-pointer items-center justify-center rounded-md border-2 border-solid border-[#2b2c34] transition dark:border-[#2cb67d]"
              :class="{ 'bg-[#2b2c34] dark:bg-[#2cb67d]': pixelResolution === 16 }"
            >
              <p
                class="text-xs font-bold text-[#2b2c34]"
                :class="{
                  'dark:text-[#2b2c34]':
                    (colorMode.preference === 'light' && pixelResolution !== 16) ||
                    (pixelResolution === 16 && colorMode.preference === 'dark'),
                  'dark:text-[#2cb67d]': colorMode.preference === 'dark' && pixelResolution !== 16,
                  'text-[#fffffe]': pixelResolution === 16 && colorMode.preference === 'light',
                }"
              >
                16x16
              </p>
            </button>
          </div>
        </div>
        <!-- canvas -->
        <div class="flex space-x-2">
          <div>
            <button
              @click="show"
              class="tooltip grid h-12 w-12 cursor-pointer items-center justify-center rounded-md border-2 border-solid border-[#2b2c34] dark:border-[#2cb67d]"
            >
              <span class="tooltip-text opacity-0">Download</span>
              <img
                v-if="colorMode.preference === 'light'"
                src="~/assets/download.svg"
                width="32"
                height="32"
                alt="pen-icon"
              />
              <img
                v-else-if="colorMode.preference === 'dark'"
                src="~/assets/dark/download_dark.svg"
                width="32"
                height="32"
                alt="pen-icon"
              />
            </button>
          </div>
          <div>
            <button
              @click="clear(canvas, previewCanvas)"
              class="tooltip grid h-12 w-12 cursor-pointer items-center justify-center rounded-md border-2 border-solid border-[#2b2c34] dark:border-[#2cb67d]"
            >
              <span class="tooltip-text opacity-0">Clear Canvas</span>
              <img
                v-if="colorMode.preference === 'light'"
                src="~/assets/clear.svg"
                width="32"
                height="32"
                alt="pen-icon"
              />
              <img
                v-else-if="colorMode.preference === 'dark'"
                src="~/assets/dark/clear_dark.svg"
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
  <!-- modal -->
  <transition name="modal">
    <div v-show="visibleModal" class="fixed top-0 z-10 flex h-full w-full items-center justify-center bg-[#2b2c34]/60">
      <input type="radio" name="size" value="128" id="size-sm" v-model="imageSize" class="hidden" />
      <input type="radio" name="size" value="256" id="size-md" v-model="imageSize" class="hidden" />
      <input type="radio" name="size" value="512" id="size-lg" v-model="imageSize" class="hidden" />
      <div class="box-shadow z-20 inline-flex space-x-4 rounded-md bg-[#fffffe] p-4 dark:bg-[#16161a]">
        <canvas
          data="downloadCanvas"
          ref="downloadCanvas"
          :width="previewSize"
          :height="previewSize"
          class="border border-solid border-[#2b2c34] dark:border-[#2cb67d]"
        ></canvas>
        <div class="space-y-4">
          <div class="flex justify-end">
            <button @click="dismiss">
              <img
                v-if="colorMode.preference === 'light'"
                src="~/assets/close.svg"
                width="16"
                height="16"
                alt="pen-icon"
              />
              <img
                v-else-if="colorMode.preference === 'dark'"
                src="~/assets/dark/close_dark.svg"
                width="16"
                height="16"
                alt="pen-icon"
              />
            </button>
          </div>
          <div class="flex items-end space-x-2">
            <input
              type="text"
              class="w-40 rounded-md border-2 border-solid border-[#2b2c34] px-2 py-1 dark:border-[#2cb67d] dark:bg-[#16161a] dark:text-[#2cb67d] placeholder:dark:text-[#2cb67d]/60"
              placeholder="Image Name"
              v-model="imageName"
            />
            <p class="mb-1 text-sm font-bold dark:text-[#2cb67d]">.png</p>
          </div>
          <div class="flex space-x-4">
            <div class="grid grid-cols-3 gap-x-2">
              <label
                for="size-sm"
                class="tooltip inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-md border-2 border-solid border-[#2b2c34] transition dark:border-[#2cb67d]"
                :class="{
                  'bg-[#2b2c34] dark:bg-[#2cb67d]': imageSize === '128',
                }"
              >
                <span class="tooltip-text opacity-0">Image Size 128px</span>
                <p
                  class="text-xs font-bold text-[#2b2c34]"
                  :class="{
                    'dark:text-[#2cb67d]': imageSize !== '128',
                    'text-[#fffffe] dark:text-[#16161a]': imageSize === '128',
                  }"
                >
                  128px
                </p>
              </label>
              <label
                for="size-md"
                class="tooltip inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-md border-2 border-solid border-[#2b2c34] transition dark:border-[#2cb67d]"
                :class="{
                  'bg-[#2b2c34] dark:bg-[#2cb67d]': imageSize === '256',
                }"
              >
                <span class="tooltip-text opacity-0">Image Size 256px</span>
                <p
                  class="text-xs font-bold text-[#2b2c34]"
                  :class="{
                    'dark:text-[#2cb67d]': imageSize !== '256',
                    'text-[#fffffe] dark:text-[#16161a]': imageSize === '256',
                  }"
                >
                  256px
                </p>
              </label>
              <label
                for="size-lg"
                class="tooltip inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-md border-2 border-solid border-[#2b2c34] transition dark:border-[#2cb67d]"
                :class="{
                  'bg-[#2b2c34] dark:bg-[#2cb67d]': imageSize === '512',
                }"
              >
                <span class="tooltip-text opacity-0">Image Size 512px</span>
                <p
                  class="text-xs font-bold text-[#2b2c34]"
                  :class="{
                    'dark:text-[#2cb67d]': imageSize !== '512',
                    'text-[#fffffe] dark:text-[#16161a]': imageSize === '512',
                  }"
                >
                  512px
                </p>
              </label>
            </div>
            <div>
              <button
                @click="downloadImage(downloadCanvas)"
                class="tooltip grid h-12 w-12 cursor-pointer items-center justify-center rounded-md border-2 border-solid border-[#2b2c34] disabled:cursor-not-allowed disabled:border-[#2b2c34]/30 dark:border-[#2cb67d] dark:disabled:border-[#2cb67d]/30"
                :disabled="imageName === ''"
              >
                <span class="tooltip-text opacity-0">Download</span>
                <img
                  v-if="colorMode.preference === 'light'"
                  src="~/assets/download.svg"
                  :class="{ 'opacity-30': imageName === '' }"
                  width="32"
                  height="32"
                  alt="download-icon"
                />
                <img
                  v-else-if="colorMode.preference === 'dark'"
                  src="~/assets/dark/download_dark.svg"
                  :class="{ 'opacity-30': imageName === '' }"
                  width="32"
                  height="32"
                  alt="download-icon"
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
  cursor: url('assets/pencil-cursor.svg') 0 12, default;
}

.bucket-cursor {
  cursor: url('assets/fill-cursor.svg') 12 12, default;
}

.stroke-cursor {
  cursor: url('assets/stroke-cursor.svg') 0 12, default;
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
