<script setup lang="ts">
const colorMode = useColorMode();
const { isDesktop } = useDevice();
const isDarkmode = ref(false);
watchEffect(() => {
  if (isDarkmode.value === true) {
    colorMode.preference = "dark";
  } else {
    colorMode.preference = "light";
  }
});
</script>

<template>
  <div class="bg-[#fffffe] dark:bg-[#16161a] transition">
    <div class="flex flex-col min-h-screen">
      <header
        class="flex justify-between items-center max-w-[1128px] w-full mx-auto py-4 px-4 lg:px-0"
      >
        <h1
          class="text-2xl leading-none font-bold text-[#2b2c34] dark:text-[#2cb67d]"
        >
          Pixel<span class="text-[#ED0C13] dark:text-[#7f5af0]">a</span
          ><span class="text-[#8BF0A5] dark:text-[#e53170]">r</span
          ><span class="text-[#78B4F0] dark:text-[#ff8906]">t</span> Creator
        </h1>
        <div class="relative rounded-full w-[52px] h-[30px]">
          <input
            class="appearance-none absolute z-10 rounded-full w-full h-full opacity-0 cursor-pointer"
            type="checkbox"
            v-model="isDarkmode"
          />
          <div
            class="fkex items-center relative rounded-full p-1 w-full h-full bg-[#d1d1e9] checkbox-box-shadow dark:bg-[#2cb67d]"
          >
            <div
              class="relative rounded-[11px] origin-left w-[22px] h-[22px] bg-[#fffffe] checkbox-shadow animation"
              :class="{ 'active-animation': isDarkmode }"
            ></div>
          </div>
        </div>
      </header>
      <slot v-if="isDesktop" />
      <div
        v-else
        class="grow flex items-center justify-center px-4 text-xl text-[#2b2c34] dark:text-[#2cb67d]"
      >
        <p class="text-xl font-semibold">
          We apologize, but the current service is recommended for use on a PC
          browser. Please try accessing it from a PC.
        </p>
      </div>
      <footer class="max-w-[1128px] w-full mx-auto py-2">
        <p
          class="text-center text-sm text-[#2b2c34] opacity-80 dark:text-[#2cb67d]"
        >
          © 2023 tsukiyama
        </p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.transition {
  transition: 0.2s ease-in;
}

.checkbox-box-shadow {
  box-shadow: inset 0 1px 2px rgb(0 0 0 / 0.2);
  transition: background-color 0.2s linear;
}

.checkbox-shadow {
  box-shadow: 0 4px 4px rgb(0 0 0 / 0.2), inset 0 -2px 4px rgb(0 0 0 / 0.2);
}

.animation {
  animation-name: grow-out, bounce-out;
  animation-duration: 0.2s;
  animation-timing-function: cubic-bezier(0.75, 0, 1, 1),
    cubic-bezier(0, 0, 0.3, 1.5);
  animation-delay: 0s, 0.2s;
  animation-fill-mode: forwards;
}

.active-animation {
  animation-name: grow-in, bounce-in;
}

@keyframes bounce-out {
  0% {
    border-radius: calc(11px * (22 / 34)) / calc(11px * (22 / 16));
    transform: translateX(2px) scale(calc(34 / 22), calc(16 / 22));
  }
  100% {
    border-radius: 11px;
    transform: translateX(0) scale(1);
  }
}

@keyframes grow-in {
  0% {
    border-radius: 11px;
    transform: translateX(0) scale(1);
  }
  100% {
    border-radius: calc(11px / (34 / 22)) / calc(11px / (16 / 22));
    transform: translateX(8px) scale(calc(34 / 22), calc(16 / 22));
  }
}

@keyframes bounce-in {
  0% {
    border-radius: calc(11px / (34 / 22)) / calc(11px / (16 / 22));
    transform: translateX(8px) scale(calc(34 / 22), calc(16 / 22));
  }
  100% {
    border-radius: 11px;
    transform: translateX(100%) scale(1);
  }
}

@keyframes grow-out {
  0% {
    border-radius: calc(11px);
    transform: translateX(100%) scale(1);
  }
  100% {
    border-radius: calc(1 / (34 / 22) * 11px) / calc(1 / (16 / 22) * 11px);
    transform: translateX(2px) scale(34 / 22, 16 / 22);
  }
}
</style>
