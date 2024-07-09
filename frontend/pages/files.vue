<template>
  <main>
    <h1><Icon name="tabler:folder" /><span>Archivos</span></h1>
    <div class="content">
      <Select v-model="filter" v-if="files.length > 0">
        <SelectTrigger class="mt-4 mx-4 w-52">
          <SelectValue placeholder="Filtrar" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="media">Imágenes/videos</SelectItem>
          <SelectItem value="doc">Documentos</SelectItem>
          <SelectItem value="audio">Audios</SelectItem>
        </SelectContent>
      </Select>
      <div
        v-if="files.length === 0"
        class="flex items-center h-[80%] w-full justify-center gap-2"
      >
        <h3 class="text-lg text-center">
          Aquí no hay nada<br /><span class="text-3xl">¯\_(ツ)_/¯</span>
        </h3>
      </div>
      <div
        class="files-container grid lg:grid-cols-4 md:grid-cols-3 grid-cols-2 p-4 gap-4"
      >
        <div
          v-for="file in files"
          :key="file.id"
          v-show="filter === 'all' || checkShow(file?.filetype) === filter"
          class="relative overflow-hidden rounded-md shadow-md file cursor-pointer active:scale-[0.98]"
          @click="showFileInfo(file.id)"
        >
          <span
            class="flex items-center justify-between gap-2 absolute top-2 right-2 px-2 py-1 rounded-lg z-20 ring-neutral-100 ring-1 text-xs text-white bg-amber-600"
            v-if="file.isInResponse"
            ><Icon name="tabler:square-check-filled" />EN USO</span
          >
          <img
            v-if="file?.filetype?.startsWith('image')"
            :src="`${back_url}/api/media/${file.id}`"
            :alt="file?.filename"
            class="object-cover w-full h-48 cursor-pointer"
            decoding="async"
            loading="lazy"
            draggable="false"
          />
          <div
            v-else
            class="flex items-center justify-center w-full h-48 bg-gray-200 text-gray-600 cursor-pointer"
          >
            <Icon :name="getIcon(file.filetype)" class="w-16 h-16" />
          </div>
          <div
            class="absolute inset-0 bg-black hover:bg-opacity-60 bg-opacity-30 transition-colors flex flex-col items-start justify-end p-2"
          >
            <h3 class="text-white font-semibold tracking-tight break-all">
              {{ file.originalname }}
            </h3>
            <small class="text-xs text-gray-300">{{
              niceType[file.filetype.split("/")[0]]
            }}</small>
          </div>
        </div>
      </div>
    </div>

    <!-- Panel para mostrar detalles del archivo -->
    <Dialog :open="showDialog" @update:open="showDialog = $event">
      <DialogTrigger as-child> </DialogTrigger>
      <DialogContent class="max-w-3xl">
        <DialogHeader>
          <DialogTitle
            class="text-3xl font-bold mb-4 max-w-[80vw] sm:max-w-[30ch] leading-none overflow-hidden text-ellipsis whitespace-nowrap"
          >
            {{ selectedFile?.originalname }}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription>
          <div class="flex flex-col md:flex-row gap-6">
            <div class="md:w-1/2">
              <div
                class="bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center"
              >
                <div
                  class="el-wrapper"
                  v-if="selectedFile?.filetype?.startsWith('image')"
                >
                  <img
                    :src="`${back_url}/api/media/${selectedFile.id}`"
                    class="h-full w-full object-contain z-10 absolute"
                    alt="Vista previa del archivo"
                    decoding="async"
                    loading="lazy"
                    draggable="false"
                  />
                  <img
                    :src="`${back_url}/api/media/${selectedFile.id}`"
                    class="h-full w-full object-cover z-0 absolute blur-[2px] brightness-50"
                    alt="Vista previa del archivo"
                    decoding="async"
                    loading="lazy"
                    draggable="false"
                  />
                </div>
                <div v-else class="el-wrapper">
                  <Icon
                    :name="getIcon(selectedFile?.filetype)"
                    class="text-6xl text-gray-400"
                  />
                </div>
              </div>
            </div>
            <div class="md:w-1/2">
              <ul
                class="space-y-4 max-h-[25svh] sm:max-h-[45svh] overflow-auto"
              >
                <li class="bg-gray-50 p-3 rounded-md shadow-sm overflow-hidden">
                  <p
                    class="text-gray-700 leading-none break-all overflow-hidden"
                  >
                    <span class="font-semibold">Nombre original:</span>
                    <span class="ml-2 text-gray-900 max-w-[80%]">{{
                      selectedFile.originalname
                    }}</span>
                  </p>
                </li>
                <li class="bg-gray-50 p-3 rounded-md shadow-sm">
                  <span class="font-semibold text-gray-700">Tamaño:</span>
                  <span class="ml-2 text-gray-900">{{
                    formatSize(selectedFile.size)
                  }}</span>
                </li>
                <li class="bg-gray-50 p-3 rounded-md shadow-sm">
                  <span class="font-semibold text-gray-700"
                    >Fecha de creación:</span
                  >
                  <span class="ml-2 text-gray-900">{{
                    formatTimestamp(selectedFile.createdAt)
                  }}</span>
                </li>
                <li
                  class="bg-gray-50 p-3 rounded-md shadow-sm"
                  v-if="selectedFile.isInResponse"
                >
                  <span class="font-semibold text-gray-700"
                    >Se está usando para responder</span
                  >
                </li>
              </ul>
            </div>
          </div>
        </DialogDescription>
        <DialogFooter
          class="mt-8 flex flex-row justify-center md:justify-end gap-4"
        >
          <DropdownMenu>
            <DropdownMenuTrigger as-child
              ><Button
                ><Icon name="tabler:eye-bolt" class="min-w-4 min-h-4" /></Button
            ></DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel class="select-none"
                >Más acciones</DropdownMenuLabel
              >
              <DropdownMenuSeparator />
              <DropdownMenuItem class="flex justify-start gap-2 items-center"
                ><a
                  :href="`${back_url}/api/media/${selectedFile?.id}?download=true`"
                  class="flex justify-start gap-2 items-center w-full"
                  ><Icon name="tabler:cloud-download" />Descargar</a
                >
              </DropdownMenuItem>
              <DropdownMenuItem
                class="flex justify-start gap-2 items-center"
                @click="changeFile()"
                ><Icon name="tabler:pencil" />Reemplazar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="destructive"
            @click="
              alertDelete.state = true;
              alertDelete.file = selectedFile;
            "
            ><Icon name="tabler:trash" class="mr-2" />Eliminar</Button
          >
          <Button variant="outline" @click="closeFileInfoPanel"
            ><Icon name="tabler:x" class="mr-2" />Cerrar</Button
          >
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog :open="showAddDialog" @update:open="showAddDialog = $event">
      <TooltipProvider>
        <Tooltip>
          <DialogTrigger as-child>
            <Button class="add-button" @click="showAddDialog = true">
              <TooltipTrigger
                class="focus:outline-none focus-within:outline-none focus-visible:outline-none"
              >
                <Icon name="tabler:cloud-upload" />
              </TooltipTrigger>
            </Button>
          </DialogTrigger>
          <TooltipContent>
            <p>Subir archivo</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent>
        <DialogHeader>
          <DialogTitle> Subir archivo </DialogTitle>
        </DialogHeader>
        <DialogDescription>
          <div class="flex flex-col">
            <div class="mt-4"></div>
            <form @submit.prevent id="upload-file">
              <div
                class="flex items-center justify-center w-full"
                v-if="!uploadingFile.uploading"
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
                    <p class="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span class="font-semibold"
                        >Haz clic para seleccionar,</span
                      >
                      o arrastra un archivo
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      Cualquier tipo de archivo
                    </p>
                  </div>
                  <input
                    id="dropzone-file"
                    type="file"
                    class="hidden"
                    @change="handleFile"
                    :accept="uploadTypes.types ?? '*'"
                  />
                </label>
              </div>
            </form>
            <div class="file-item" v-if="uploadingFile.name">
              <div class="file-icon">
                <Icon
                  :name="
                    !uploadingFile.uploading ? 'tabler:check' : 'tabler:file'
                  "
                />
              </div>
              <div class="file-details">
                <div class="file-name">{{ uploadingFile.name }}</div>
                <div class="file-status">
                  {{ uploadingFile.progress === 100 ? "Subido" : "Subiendo" }}
                </div>
                <div class="progress-bar">
                  <div
                    class="progress"
                    :style="{ width: `${uploadingFile.progress}%` }"
                  ></div>
                </div>
              </div>
              <div class="file-check" v-if="uploadingFile.progress === 100">
                ✓
              </div>
            </div>
          </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>
    <AlertDialog
      :open="alertDelete.state"
      @update:open="alertDelete.state = $event"
    >
      <AlertDialogTrigger as-child></AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle
            >¿Está seguro que desea eliminar el archivo "{{
              alertDelete?.file?.originalname?.slice(0, 20)
            }}"?</AlertDialogTitle
          >
          <AlertDialogDescription>
            Esta acción es permanente, y
            {{
              alertDelete?.file?.isInResponse
                ? "las respuestas a las que está vinculado serán eliminadas también"
                : "no se puede deshacer"
            }}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            @click="
              alertDelete.state = false;
              alertDelete.file = emptyFile;
            "
            >Cancelar</AlertDialogCancel
          >
          <AlertDialogAction @click="deleteFile(alertDelete.file?.id)"
            >Continuar</AlertDialogAction
          >
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </main>
</template>

<script setup lang="ts">
const { back_url } = useRuntimeConfig().public;
definePageMeta({
  title: "Archivos",
});
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
const emptyFile: FileInfo = {
  id: "",
  filename: null,
  size: 0,
  createdAt: new Date(),
  isInResponse: false,
  responseIds: [0],
  filetype: "",
  originalname: "",
};
const niceType = {
  image: "Archivo de Imagen",
  application: "Documento",
  video: "Archivo de Video",
  audio: "Archivo de Audio",
};
let selectedFile: Ref<FileInfo> = ref({
  id: "",
  filename: "",
  originalname: "",
  filetype: "",
  size: 0,
  createdAt: new Date(),
  isInResponse: false,
  responseIds: [],
});

// ? -> FILE Uploading
let files: Ref<FileInfo[]> = ref([]);
let replacing = ref(false);
let recentUpload = ref();
const changeFile = () => {
  replacing.value = true;
  const newTypes = getTypes(selectedFile.value.filetype?.split("/")[0]);
  uploadTypes.value = newTypes;
  setTimeout(() => {
    showAddDialog.value = true;
  }, 100);
};
let uploadTypes: Ref<{ text: string | "Cualquiera"; types: string | "*" }> =
  ref({ text: "Cualquiera", types: "*" });
let showAddDialog = ref(false);
let uploadingFile: Ref<{
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
let alertDelete: Ref<{ state: boolean; file: FileInfo }> = ref({
  state: false,
  file: emptyFile,
});
let showDialog = ref(false);
watch(showDialog, (val) => {
  const newTypes = getTypes(selectedFile.value.filetype?.split("/")[0]);
  !val ? (replacing.value = false) : null;
  !val ? (uploadTypes.value = newTypes) : null;
});
let filter = ref("all");
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

const getTypes = (type: string): { types: string; text: string } => {
  switch (type) {
    case "image":
      return { types: "image/*", text: "Subir una imagen" };
    case "sticker":
      return { types: "image/*", text: "Subir una imagen" };
    case "doc":
      return {
        types: "application/*,video/*",
        text: "Subir un documento/video",
      };
    case "audio":
      return {
        types: "audio/wav,audio/ogg,audio/mpeg",
        text: "Subir un audio",
      };
    default:
      return { types: "*", text: "Cualquiera" };
  }
};
async function handleFile(e: Event) {
  const fileInput = e.target as HTMLInputElement;
  const files = fileInput.files;

  if (files && files.length > 0) {
    uploadingFile.value.file = files[0];
    uploadingFile.value.name = files[0].name;
    uploadFile();
  }
}

async function uploadFile() {
  const formData = new FormData();
  formData.append("file", uploadingFile.value.file);

  const xhr = new XMLHttpRequest();

  xhr.upload.addEventListener("progress", (event) => {
    if (event.lengthComputable) {
      const fileLoaded = Math.floor((event.loaded / event.total) * 100);
      uploadingFile.value.progress = fileLoaded;
    }
  });

  xhr.addEventListener("load", () => {
    if (xhr.status === 200) {
      const data = JSON.parse(xhr.responseText);
      recentUpload.value = data.id;
    } else {
      console.error("Error al cargar el archivo:", xhr.statusText);
    }
    uploadingFile.value.uploading = false;
  });

  xhr.addEventListener("error", () => {
    console.error("Error de red durante la carga del archivo.");
    uploadingFile.value.uploading = false;
  });

  if (replacing.value) {
    const fileId = selectedFile.value.id;
    xhr.open("PUT", `${back_url}/api/media/${fileId}`, true);
  } else {
    xhr.open("POST", `${back_url}/api/media`, true);
  }

  xhr.send(formData);
  setTimeout(() => {
    getData();
    alertDelete.value.state = false;
    showDialog.value = false;
    showAddDialog.value = false;
    alertDelete.value.file = {
      id: "",
      filename: null,
      size: 0,
      createdAt: new Date(),
      isInResponse: false,
      responseIds: [0],
      filetype: "",
      originalname: "",
    };
    uploadingFile.value = {
      name: "",
      progress: 0,
      uploading: false,
      file: null,
    };
  }, 200);
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
function showFileInfo(id: number) {
  fetch(`${back_url}/api/info/media/${id}`)
    .then((response) => response.json())
    .then((data) => {
      selectedFile.value = data;
      showDialog.value = true;
    })
    .catch((error) => {
      console.error("Error fetching file info:", error);
    });
}

function closeFileInfoPanel() {
  showDialog.value = false;
  setTimeout(() => {
    selectedFile.value = {
      id: "",
      filename: null,
      size: 0,
      createdAt: new Date(),
      isInResponse: false,
      responseIds: [0],
      filetype: "",
      originalname: "",
    };
  }, 100);
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatTimestamp(timestamp: string, locale: string = "es-CO"): string {
  const date = new Date(timestamp);
  return date.toLocaleString(locale, { timeZone: "UTC" });
}

async function deleteFile(id: string) {
  try {
    await fetch(`${back_url}/api/media/${id}`, {
      method: "DELETE",
    });
    getData();
    setTimeout(() => {
      alertDelete.value.state = false;
      showDialog.value = false;
      alertDelete.value.file = {
        id: "",
        filename: null,
        size: 0,
        createdAt: new Date(),
        isInResponse: false,
        responseIds: [0],
        filetype: "",
        originalname: "",
      };
      selectedFile.value = emptyFile;
    }, 200);
  } catch (error) {
    console.error(error);
  }
}
onBeforeMount(() => getData());
</script>

<style>
.file {
  & h3 {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1;
  }
}
.el-wrapper {
  @apply w-full h-full aspect-video flex items-center justify-center relative;
  @media (min-width: 768px) {
    @apply aspect-square;
  }
}
</style>
