<template>
  <main>
    <h1><Icon name="tabler:message-2-check" /><span>Respuestas</span></h1>
    <div class="content pb-12">
      <div
        v-if="responses.length === 0"
        class="flex items-center h-[80%] w-full justify-center gap-2"
      >
        <h3 class="text-lg text-center">
          Aquí no hay nada<br /><span class="text-3xl">¯\_(ツ)_/¯</span>
        </h3>
      </div>
      <Table v-if="responses.length > 0">
        <TableHeader class="select-none">
          <TableRow>
            <TableHead>Contiene</TableHead>
            <TableHead>Responder</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="response in responses"
            :key="response.id"
            class="h-16"
          >
            <TableCell class="max-w-[100px] text-ellipsis overflow-hidden">
              {{ response.contains }}
            </TableCell>
            <TableCell class="max-w-[100px] text-ellipsis overflow-hidden">
              <span v-if="response.type == 'text'">{{ response.answer }}</span>
              <NuxtImg
                decoding="async"
                loading="lazy"
                draggable="false"
                v-else-if="
                  response.type == 'image' || response.type == 'sticker'
                "
                :src="`${back_url}/api/media/${response.answer}`"
                class="w-auto h-16 aspect-video object-cover rounded-md"
              />
              <div class="flex items-center gap-2" v-else>
                <Icon
                  :name="niceType[response?.type].icon"
                  class="min-w-3 min-h-3"
                /><span
                  class="max-w-[80%] leading-none overflow-hidden text-ellipsis whitespace-nowrap"
                  >{{ fileInfo(response.answer) }}</span
                >
              </div>
            </TableCell>
            <TableCell
              class="max-w-[100px] text-ellipsis overflow-hidden whitespace-nowrap flex gap-2 items-center"
            >
              <Icon :name="niceType[response?.type].icon" />{{
                niceType[response.type].name
              }}
            </TableCell>
            <TableCell>
              <div class="flex gap-2">
                <Button
                  variant="outline"
                  class="flex !px-2 !py-1 h-6 text-[.8rem] active:scale-[.95] gap-2 items-center"
                  ><Icon name="tabler:pencil"
                /></Button>
                <Button
                  variant="destructive"
                  class="flex !px-2 !py-1 h-6 text-[.8rem] active:scale-[.95] gap-2 items-center"
                  @click="deleteResponse(response.id)"
                  ><Icon name="tabler:trash"
                /></Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <Dialog :open="showDialog" @update:open="showDialog = $event">
        <DialogTrigger as-child>
          <TooltipProvider>
            <Tooltip>
              <DialogTrigger as-child>
                <Button class="add-button">
                  <TooltipTrigger
                    class="focus:outline-none focus-within:outline-none focus-visible:outline-none"
                  >
                    <Icon name="material-symbols:add" />
                  </TooltipTrigger>
                </Button>
              </DialogTrigger>
              <TooltipContent>
                <p>Agregar respuesta</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle class="text-2xl text-left"
              >Agregar respuesta</DialogTitle
            >
            <DialogDescription>
              <div class="flex flex-col mt-2">
                <Label for="contains" class="text-md text-left mb-1"
                  >Si contiene alguna de estas palabras</Label
                >
                <ShadInput
                  v-model="newResponse.contains"
                  id="contains"
                  placeholder="Escribe aquí"
                />
              </div>
              <div class="flex flex-col mt-2">
                <Label for="answer" class="text-md text-left mb-1"
                  >Entonces responder con un/a</Label
                >
                <Select id="answer" v-model="newResponse.type">
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Texto</SelectItem>
                    <SelectItem value="image">Imagen</SelectItem>
                    <SelectItem value="doc">Documento</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="sticker">Sticker</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div
                class="flex flex-col mt-2"
                v-if="newResponse.type === 'text'"
              >
                <Label for="answer" class="text-md text-left mb-1"
                  >que diga:</Label
                >
                <ShadInput
                  v-model="newResponse.answer"
                  placeholder="Escribe aquí"
                />
              </div>
              <div
                class="flex flex-col mt-2"
                v-if="
                  newResponse.type === 'image' ||
                  newResponse.type === 'doc' ||
                  newResponse.type === 'audio' ||
                  newResponse.type === 'sticker'
                "
              >
                <div class="mt-4"></div>
                <form @submit.prevent id="upload-file">
                  <div
                    class="flex items-center justify-center w-full"
                    v-if="newResponse.answer === '' && !selectedFile.uploading"
                  >
                    <label
                      for="dropzone-file"
                      class="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
                    >
                      <div
                        class="flex flex-col items-center justify-center pt-5 pb-6"
                      >
                        <svg
                          class="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 20 16"
                        >
                          <path
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                          />
                        </svg>
                        <p
                          class="mb-2 text-sm text-gray-500 dark:text-gray-400"
                        >
                          <span class="font-semibold"
                            >Haz clic para seleccionar,</span
                          >
                          o arrastra un archivo
                        </p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                          {{ getTypes(newResponse.type)?.text }}
                        </p>
                      </div>
                      <input
                        id="dropzone-file"
                        type="file"
                        class="hidden"
                        @change="handleFile"
                        :accept="getTypes(newResponse.type).types"
                      />
                    </label>
                  </div>
                </form>
                <div class="file-item" v-if="selectedFile.name">
                  <div class="file-icon">
                    <Icon
                      :name="
                        selectedFile.progress === 100
                          ? 'tabler:check'
                          : 'tabler:file'
                      "
                    />
                  </div>
                  <div class="file-details">
                    <div class="file-name">{{ selectedFile.name }}</div>
                    <div class="file-status">
                      {{
                        selectedFile.progress === 100 ? "Subido" : "Subiendo"
                      }}
                    </div>
                    <div class="progress-bar">
                      <div
                        class="progress"
                        :style="{ width: `${selectedFile.progress}%` }"
                      ></div>
                    </div>
                  </div>
                </div>
                <h3 class="mt-2 text-center text-lg">
                  O selecciona uno ya subido
                </h3>
                <Button variant="destructive" @click="showFiles = true"
                  ><Icon name="tabler:folder-search" class="mr-2" />Ver
                  biblioteca</Button
                >
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter class="mt-6">
            <Button
              variant="outline"
              :disabled="!showDialog"
              @click="cleanForm()"
              >Cancelar</Button
            >
            <Button @click="addResponse" :disabled="!showDialog"
              >Agregar</Button
            >
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    <Sheet :open="showFiles" @update:open="showFiles = $event">
      <SheetTrigger as-child></SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle
            ><Icon name="tabler:folder-search" class="-mb-[1px] mr-2" />Archivos
            subidos</SheetTitle
          >
          <SheetDescription>
            <FileExplorer @fileSelected="handleFileSelected" />
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  </main>
</template>

<script setup lang="ts">
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";
import { Sheet } from "@/components/ui/sheet";
definePageMeta({
  title: "Respuestas",
});
const { back_url } = useRuntimeConfig().public;
type Response = {
  id?: string;
  contains: string;
  type: "text" | "image" | "doc" | "audio" | "sticker";
  answer: string;
};
const emptyResponse: Response = { contains: "", type: "text", answer: "" };
const emptyFile: {
  name: string;
  progress: number;
  uploading: boolean;
  file: any;
} = { name: "", progress: 0, uploading: false, file: null };
let newResponse = ref<Response>({
  contains: "",
  type: "text",
  answer: "",
});
const niceType = {
  text: { name: "Texto", icon: "tabler:text-caption" },
  image: { name: "Imagen", icon: "tabler:photo" },
  doc: { name: "Archivo", icon: "tabler:paperclip" },
  audio: { name: "Audio", icon: "tabler:music" },
  sticker: { name: "Sticker", icon: "tabler:sticker-2" },
};
const getTypes = (type: string) => {
  switch (type) {
    case "image":
      return { types: "image/*", text: "Subir una imagen" };
    case "sticker":
      return { types: "image/*", text: "Subir una imagen" };
    case "doc":
      return { types: "application/*", text: "Subir un documento" };
    case "audio":
      return {
        types: "audio/wav,audio/ogg,audio/mpeg",
        text: "Subir un audio",
      };
  }
};
let responses = ref<Response[]>([]);
let showFiles = ref(false);
let selectedFile: Ref<{
  name: string;
  progress: number;
  uploading: boolean;
  file: any;
}> = ref({
  name: "",
  progress: 0,
  uploading: false,
  file: null,
});
let showDialog = ref(false);
function fileInfo(id: number) {
  const request = new XMLHttpRequest();
  request.open("GET", `${back_url}/api/info/media/${id}`, false);
  request.send(null);
  if (request.status === 200) {
    const data = JSON.parse(request.responseText);
    return data.originalname;
  } else {
    throw new Error("Request failed");
  }
}
const cleanForm = () => {
  showDialog.value = false;
  setTimeout(() => {
    newResponse.value = emptyResponse;
    selectedFile.value = emptyFile;
  }, 100);
};
const handleFileSelected = (file: any) => {
  newResponse.value.answer = file.id;
  selectedFile.value = {
    name: file.originalname,
    progress: 100,
    uploading: false,
    file: null,
  };
  showFiles.value = false;
};
async function getData() {
  const response = await fetch(`${back_url}/api/db/responses`, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
  const data = await response.json();
  responses.value = data;
}

async function handleFile(e: Event) {
  const fileInput = e.target as HTMLInputElement;
  const files = fileInput.files;

  if (files && files.length > 0) {
    selectedFile.value.file = files[0];
    selectedFile.value.name = files[0].name;
    uploadFile();
  }
}

async function uploadFile() {
  const formData = new FormData();
  formData.append("file", selectedFile.value.file);

  const xhr = new XMLHttpRequest();

  xhr.upload.addEventListener("progress", (event) => {
    if (event.lengthComputable) {
      const fileLoaded = Math.floor((event.loaded / event.total) * 100);
      selectedFile.value.progress = fileLoaded;
    }
  });

  xhr.addEventListener("load", () => {
    if (xhr.status === 200) {
      const data = JSON.parse(xhr.responseText);
      newResponse.value.answer = data.id;
    } else {
      console.error("Error al cargar el archivo:", xhr.statusText);
    }
    selectedFile.value.uploading = false;
  });

  xhr.addEventListener("error", () => {
    console.error("Error de red durante la carga del archivo.");
    selectedFile.value.uploading = false;
  });

  xhr.open("POST", `${back_url}/api/media`, true);
  xhr.send(formData);
}

async function addResponse() {
  try {
    const response = await fetch(`${back_url}/api/db/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(newResponse.value),
    });
    if (!response.ok) {
      throw new Error("Failed to add response");
    }
    const data = await response.json();
    cleanForm();
    getData();
  } catch (error) {
    console.error(error);
  }
}

async function deleteResponse(id: number) {
  const response = await fetch(`${back_url}/api/db/responses/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to delete response");
  }
  getData();
}
onBeforeMount(() => getData());
</script>

<style>
.file-item {
  display: flex;
  align-items: center;
  background-color: #f0f4f9;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
}

.file-icon {
  font-size: 24px;
  margin-right: 12px;
}

.file-details {
  flex-grow: 1;
}

.file-name {
  font-weight: bold;
  margin-bottom: 4px;
}

.file-status {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.progress-bar {
  background-color: #e0e0e0;
  height: 4px;
  border-radius: 2px;
  overflow: hidden;
}

.progress {
  background-color: #4285f4;
  height: 100%;
  transition: width 0.3s ease;
}

.file-check {
  color: #34a853;
  font-size: 20px;
}
.add-button {
  @apply fixed bottom-32 right-10 rounded-xl flex items-center;
  @media (min-width: 513px) {
    @apply bottom-10;
  }
}
</style>
