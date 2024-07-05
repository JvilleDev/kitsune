<template>
    <div class="content">
      <div class="px-4 pt-2">
        <Select v-model="filter">
          <SelectTrigger class="w-full">
            <SelectValue placeholder="Filtrar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="media">Imágenes/videos</SelectItem>
            <SelectItem value="doc">Documentos</SelectItem>
            <SelectItem value="audio">Audios</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div
        v-if="files.length === 0"
        class="flex items-center h-[80%] w-full justify-center gap-2"
      >
        <h3 class="text-lg text-center">
          Aquí no hay nada<br /><span class="text-3xl">¯\_(ツ)_/¯</span>
        </h3>
      </div>
      <div
        class="files-container grid grid-cols-1 p-4 gap-4"
      >
        <div
          v-for="file in files"
          :key="file.id"
          v-show="filter === 'all' || checkShow(file?.filetype) === filter"
          :class="{'selected-file': selectedFileId === file.id, 'file': true}"
          class="relative overflow-hidden rounded-lg shadow-md cursor-pointer active:scale-[0.99] select-none"
          @click="selectFile(file)"
        >
          <NuxtImg
            data-loaded='false'
            v-if="file?.filetype?.startsWith('image')"
            :src="`${back_url}/api/media/${file.id}`"
            :alt="file?.filename"
            class="object-cover w-full h-48 cursor-pointer"
            decoding="async"
            loading="lazy"
            draggable="false"
            :placeholder="[50, 25]"
          />
          <div
            v-else
            class="flex items-center justify-center w-full h-48 bg-gray-200 text-gray-600 cursor-pointer"
          >
            <Icon :name="getIcon(file.filetype)" class="w-16 h-16" />
          </div>
          <div
            class="absolute inset-0 bg-black hover:bg-opacity-40 bg-opacity-20 transition-colors flex flex-col items-start justify-end p-2"
          >
            <h3 class="text-white font-semibold tracking-tight break-all">
              {{ file.originalname }}
            </h3>
            <small class="text-xs text-gray-300">{{
              niceType[file.filetype.split("/")[0]]
            }}</small>
          </div>
          <div v-if="selectedFileId === file.id" class="absolute aspect-square w-6 h-auto top-2 right-2 flex items-center justify-center rounded-lg bg-amber-700">
              <Icon name="tabler:check" class="w-4 h-4 font-extrabold text-white"/>
            </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { defineEmits, ref } from 'vue';
  
  const emit = defineEmits(['fileSelected']);
  const { back_url } = useRuntimeConfig().public;
  type FileInfo = {
    id: string;
    filename: any;
    originalname: string;
    filetype: string;
    size: number;
    createdAt: Date;
    isInResponse: boolean;
    responseIds: Number[];
  };
  
  let filter = ref("all");
  let files: Ref<FileInfo[]> = ref([]);
  let selectedFileId = ref<string | null>(null);
  
  const niceType = {
    image: "Archivo de Imagen",
    application: "Documento",
    video: "Archivo de Video",
    audio: "Archivo de Audio",
  };
  
  async function getData() {
    const response = await fetch(`${back_url}/api/media`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const data = await response.json();
    files.value = data;
  }
  
  function getIcon(type: string) {
    switch (true) {
      case type?.startsWith("application/pdf"):
        return "tabler:file-type-pdf";
      case type?.startsWith("application"):
        return "tabler:paperclip";
      case type?.startsWith("image"):
        return "tabler:photo";
      case type?.startsWith("audio"):
        return "tabler:music";
      case type?.startsWith("video"):
        return "tabler:video";
      case type?.startsWith("text"):
        return "tabler:file-text";
      default:
        return "tabler:file";
    }
  }
  
  function checkShow(type: string) {
    switch (true) {
      case type?.startsWith("image"):
        return "media";
      case type?.startsWith("video"):
        return "media";
      case type?.startsWith("audio"):
        return "audio";
      case type?.startsWith("application"):
        return "doc";
      default:
        return false;
    }
  }
  
  function selectFile(file: FileInfo) {
    selectedFileId.value = file.id;
    emit('fileSelected', file);
  }
  
  onBeforeMount(() => getData());
  </script>
  
  <style scoped>
  .selected-file {
    @apply ring-2 ring-offset-1 ring-amber-700;
  }
  </style>
  