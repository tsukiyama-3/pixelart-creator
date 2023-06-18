import VueGtag from "vue-gtag-next";
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VueGtag, {
    property: {
      id: import.meta.env.VITE_GA_ID,
    },
  });
});
