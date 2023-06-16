<script setup lang="ts">
const { isDesktop } = useDevice();
</script>

<template>
  <div class="bg-[#fffffe]">
    <div class="flex flex-col min-h-screen">
      <header class="max-w-[1128px] w-full mx-auto py-4 px-4 lg:px-0">
        <h1 class="text-2xl leading-none font-bold text-[#2b2c34]">
          Pixel<span class="text-[#ED0C13]">a</span><span class="text-[#8BF0A5]">r</span><span class="text-[#78B4F0]">t</span> Creator
        </h1>
      </header>
      <slot v-if="isDesktop" />
      <div v-else class="grow px-4 text-xl text-[#2b2c34]">
        We apologize, but the current service is recommended for use on a PC
        browser. Please try accessing it from a PC.
      </div>
      <footer class="max-w-[1128px] w-full mx-auto py-2">
        <p class="text-center text-sm text-[#2b2c34] opacity-80">
          © 2023 tsukiyama
        </p>
      </footer>
    </div>
  </div>
</template>
