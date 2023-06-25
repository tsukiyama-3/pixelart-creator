// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      htmlAttrs: {
        lang: "en",
      },
      title: "Pixelart Creator",
      meta: [
        {
          name: "description",
          content:
            "A simple and minimalistic pixel art creator that works in the browser.",
        },
        {
          name: "keywords",
          content: "pixelart,pixelart creator,dot,ドット絵,ドット絵作成ツール",
        },
        {
          property: "og:image",
          content:
            "https://res.cloudinary.com/dyoyv8djx/image/upload/v1686912922/Pixelart%20Creator/ogp_uzvxqm.png",
        },
      ],
    },
  },
  devtools: { enabled: true },
  nitro: {
    preset: "firebase",
  },
  css: ["~/assets/css/main.css"],
  modules: ["@nuxtjs/device", "@nuxtjs/color-mode"],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  colorMode: {
    classSuffix: "",
  },
});
