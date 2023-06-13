<template>
  <div class="bg-[#fffffe]">
    <div class="flex flex-col min-h-screen">
      <header class="max-w-[1128px] w-full mx-auto py-4">
        <h1 class="text-2xl leading-none font-bold text-[#2b2c34]">Pixelart Creator</h1>
      </header>
      <slot />
      <footer class="max-w-[1128px] w-full mx-auto py-2">
        <p class="text-center text-sm text-[#2b2c34] opacity-80">© 2023 tsukiyama</p>
      </footer>
    </div>
  </div>
</template>
