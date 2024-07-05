<template>
  <div id="all">
    <aside>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Avatar class="min-w-12 max-w-24 min-h-12 max-h-24 w-[10vw] h-[10vw] p-0">
              <AvatarImage src="/favicon.svg" alt="Favicon" draggable="false" />
              <AvatarFallback>LOGO</AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>
            <p>Kitsune | Bot para WhatsApp</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <ul class="flex flex-col justify-center md:mt-8 mt-4 gap-2">
        <NuxtLink v-for="item in menuLinks" :key="item.name" :to="item.link" class="menu_item">
          <Icon :name="item.icon" class="min-h-4 min-w-4" /><span class="menu_item_text">{{ item.name }}</span>
        </NuxtLink>
      </ul>
    </aside>
    <slot />
    <nav>
      <ul class="flex items-center justify-around w-full py-4">
        <NuxtLink v-for="item in menuLinks" :key="item.name" :to="item.link" class="menu_item">
          <Icon :name="item.icon" class="min-h-5 min-w-5" /><span class="menu_item_text">{{ item.name }}</span>
        </NuxtLink>
      </ul>
    </nav>
  </div>
</template>
<style>
  aside {
    @apply bg-neutral-100 w-fit lg:w-[15vw] min-w-[5rem] max-w-[500px] p-4 rounded-r-xl shadow-neutral-300 shadow-lg z-10;

    @media(min-width: 513px) {
      dispay: block
    }

    @media(max-width: 512px) {
      display: none
    }
  }

  nav {
    @apply bottom-0 flex items-center bg-neutral-100 w-screen fixed;

    @media(min-width: 513px) {
      display: none;
    }

    @media(max-width: 512px) {
      display: block;
    }
    & ul > * {
      @apply aspect-square !p-3;
    }
  }

  #all {
    @apply flex h-svh w-svw max-w-[100vw] overflow-hidden bg-neutral-200;
  }

  .menu_item {
    @apply flex items-center gap-2 py-2 px-4 rounded-lg select-none active:scale-[.99] hover:bg-neutral-200/30 transition-colors duration-150 cursor-pointer overflow-hidden w-full;

    @media (max-width: 512px) {
      width: fit-content;
    }

    &.router-link-active {
      @apply bg-neutral-200;
    }

    & .menu_item_text {
      @apply -mb-[1px] overflow-hidden whitespace-nowrap text-ellipsis max-w-[99%];

      @media (max-width: 512px) {
        display: none;
      }
    }
  }

  main {
    @apply flex flex-col rounded-lg;

    @media (max-width: 512px) {
      width: 100vw;
    }

    @media (min-width: 513px) {
      width: calc(100vw - 150px);
    }

    & h1 {
      font-size: clamp(1.25rem, 6vw, 2rem);
      font-weight: bolder;
      @apply bg-neutral-100 p-2 m-4 rounded-xl text-center flex items-center justify-center gap-2;
      @media(min-width: 513px) {
        text-align: left;
        justify-content: start;
      }
      & span {
        @appy -mb-[2px];
      }
    }
    & .content {
      @apply bg-neutral-100 h-full m-4 rounded-xl relative overflow-x-hidden overflow-y-auto;
      @media(max-width: 512px) {
        height: calc(100svh - 13rem);
      }
    }
  }
</style>
<script setup lang="ts">
  type menuLink = {
    name: string;
    link: string;
    icon: string;
  };
  const menuLinks: menuLink[] = [
    {
      name: "Chats",
      link: "/",
      icon: "tabler:user-bolt",
    },
    {
      name: "Respuestas",
      link: "/responses",
      icon: "tabler:message-2-check",
    },
    {
      name: "Archivos",
      link: "/files",
      icon: "tabler:folder",
    },
  ];
  onBeforeMount(() => {
    useSeoMeta({
      title: computed(() =>(`${useRoute().meta.title} - Kitsune`))
    })
  })
</script>