<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
<style>
  * {
    font-family: 'Outfit', sans-serif;
    --accent-dark: rgb(229, 173, 93);
    --accent-light: 248, 226, 73;
  }

  h1,
  h2,
  h3 {
    @apply select-none;
  }

  ::-webkit-scrollbar {
    width: 3px;
    height: 3px;
  }

  ::-webkit-scrollbar-thumb {
    @apply bg-neutral-900 rounded-md;
  }

  ::-webkit-scrollbar-track {
    @apply bg-neutral-100;
  }

  .global-enter-active,
  .global-leave-active {
    transition: opacity .2s ease-in-out, filter .1s ease-in-out, transform .2s cubic-bezier(0.68, -0.55, 0.27, 1.55);
  }

  .global-enter-from,
  .global-leave-to {
    opacity: 0;
    filter: blur(5px);
    transform: translateX(-50px);
    will-change: filter;
  }
  img {
    @apply data-[loaded=false]:animate-pulse data-[loaded=false]:bg-gray-100/10;
  }
</style>
<script setup lang="ts">
  useHead({
    link: [
      {
        rel: 'icon',
        type: 'image/x-icon',
        href: '/favicon.svg'
      }
    ]
  })
</script>