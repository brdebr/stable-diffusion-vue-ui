<template>
  <n-config-provider
    :theme="darkTheme"
    :theme-overrides="naiveUiThemeOverrides"
  >
    <div id="vaisd-app-container" class="container mx-auto md:p-8 p-2">
      <div class="border-2 rounded p-5 flex flex-col gap-4">
        <div class="flex gap-1">
          <div class="w-20">Server: {{ isOnline ? "🟢" : "🔴" }}</div>
          <h1 class="title w-full text-center">Stable diffusion UI</h1>
          <div>{{ running ? "🔄" : "🔵" }}</div>
        </div>
        <hr />
        <form @submit.prevent="handleFormSubmit">
          <v-input
            input-id="prompt"
            v-model="prompt"
            label="Prompt"
            type="textarea"
            counter
          >
            <template #append-label>
              <div class="flex items-center w-full ml-2 gap-6">
                <div class="ml-auto flex items-center gap-3">
                  <n-checkbox
                    v-if="isImage2image"
                    v-model:checked="isUsingMask"
                    class="m-1"
                  >
                    use mask
                  </n-checkbox>
                  <n-checkbox v-if="false" v-model:checked="isImage2image" class="m-1">
                    img2img
                  </n-checkbox>
                </div>
                <button
                  class="border text-xs py-1 px-2 bg-blue-900"
                  type="button"
                  @click="copyPromptToClipboard"
                >
                  Copy to clipboard
                </button>
              </div>
            </template>
          </v-input>
          <template v-if="false">
            <hr class="my-4" />
            <div>
              <div class="flex justify-center items-center w-full">
                <label
                  for="dropzone-file"
                  class="flex flex-col justify-center items-center w-full h-64 bg-gray-50 rounded-lg border-2 border-gray-300 border-dashed cursor-pointer dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
                >
                  <div
                    class="flex flex-col justify-center items-center pt-5 pb-6"
                  >
                    <svg
                      aria-hidden="true"
                      class="mb-3 w-10 h-10 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      ></path>
                    </svg>
                    <p class="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span class="font-semibold">Click to upload</span> or drag
                      and drop
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      SVG, PNG, JPG or GIF (MAX. 800x400px)
                    </p>
                  </div>
                  <input id="dropzone-file" type="file" @change="setImage2ImagePrompt" class="hidden" />
                </label>
              </div>
            </div>
            <hr class="my-4 border-dashed" />
            <div>
              <div>
                <n-upload directory-dnd>
                  <n-upload-dragger>
                    <div style="margin-bottom: 12px">
                      <n-icon size="22" :depth="3">
                        <VolumeFileStorage class="w-9 h-9" />
                      </n-icon>
                    </div>
                    <n-text style="font-size: 16px">
                      Click or drag an Image Mask to this area to upload
                    </n-text>
                    <n-p depth="3" style="margin: 8px 0 0 0">
                      COGER DESCRIPOTIOCN DE L SWAGGER
                    </n-p>
                  </n-upload-dragger>
                </n-upload>
              </div>
            </div>
          </template>
        </form>
        <hr class="my-3" />
        <div class="sd-settings">
          <v-input input-id="seed" v-model="seed" label="Seed" type="text" />
          <v-input
            input-id="steps"
            v-model="steps"
            :min="minSteps"
            :max="maxSteps"
            :step="10"
            label="Steps"
            type="number"
          />
          <v-input
            input-id="width"
            v-model="width"
            :options="sizeOptions"
            label="Width"
            type="select"
          />
          <v-input
            input-id="height"
            v-model="height"
            :options="sizeOptions"
            label="Height"
            type="select"
          />
          <div class="!w-12/12 flex-1 vaisd-input-component">
            <label class="flex flex-wrap">
              <div class="w-full flex gap-1 justify-between items-center mb-3">
                <span data-test="label"> Cfg Scale </span>
                <slot name="append-label"></slot>
              </div>
              <div class="w-full flex gap-9 items-center">
                <n-slider
                  v-model:value="guidance"
                  class="w-full"
                  :min="minGuidance"
                  :max="maxGuidance"
                  :step="guidanceStep"
                />
                <n-input-number
                  v-model:value="guidance"
                  :min="minGuidance"
                  :max="maxGuidance"
                  type="text"
                  :step="guidanceStep"
                />
              </div>
            </label>
          </div>
        </div>
        <div class="mt-13">
          <n-input-group>
            <n-button
              @click="handleFormSubmit"
              type="primary"
              :disabled="!isOnline || !prompt || !steps"
              class="min-w-9 w-[calc(100%-150px)]"
            >
              Generate [ {{ imagesToGenerate }} ] image{{
                imagesToGenerate > 1 ? "s" : ""
              }}
            </n-button>
            <n-input-number
              v-model:value="imagesToGenerate"
              :min="1"
              type="text"
              placeholder="Number of images"
            />
          </n-input-group>
        </div>
        <div v-if="items.length">
          <div class="mb-3">Queue</div>
          <div class="flex flex-col gap-3">
            <div>
              <n-input
                :value="first?.prompt"
                type="textarea"
                readonly
                disabled
                placeholder="Prompt"
                show-count
              />
            </div>
            <div
              v-for="item in items.filter(
                (el) => el.queuedAt !== first?.queuedAt
              )"
              class="flex items-center gap-2"
            >
              <n-input
                v-model:value="item.prompt"
                type="textarea"
                placeholder="Prompt"
                show-count
              />
              <n-button
                type="primary"
                @click="queueStore.removeFromQueue(item.id)"
              >
                <n-icon class="min-w-[20px] text-red-700">
                  <MisuseOutline />
                </n-icon>
              </n-button>
            </div>
          </div>
        </div>
        <div v-if="images.length">
          <div class="mb-3">Images:</div>
          <div class="flex flex-col gap-3">
            <div
              v-for="image in images"
              :key="image.createdAt"
              class="flex flex-col items-center md:(flex-row items-start) border"
            >
              <div class="flex flex-col p-1">
                <img
                  class="image-view"
                  :src="image.image"
                  :title="'Click the image to download: ' + image.prompt"
                  :alt="image.prompt"
                  @click="handleDownloadImage(image)"
                />
                <div class="flex justify-between items-center p-1 pt-2">
                  <div class="text-[10px]">
                    {{ image.width }} x {{ image.height }}
                  </div>
                  <div class="text-[10px] min-w-[20ch] text-right" title="Seed">
                    {{ image.seed }}
                  </div>
                </div>
              </div>
              <div class="p-3 w-full">
                <div class="image-data flex justify-between mb-3">
                  <div>
                    {{
                      useDateFormat(
                        image.createdAt,
                        DATE_FORMAT
                      ).value.replaceAll(/\"/g, "")
                    }}
                  </div>
                  <div>
                    {{ getDuration(image.elapsedMs) }}
                  </div>
                </div>
                <div class="prompt">
                  {{ image.prompt }}
                </div>
                <div class="hidden">
                  <div>
                    <span> guidance </span>
                    <span>
                      {{ image.guidance }}
                    </span>
                  </div>
                  <div>
                    <span> steps </span>
                    <span>
                      {{ image.steps }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </n-config-provider>
</template>
<script setup lang="ts">
import { onMounted, reactive, ref, watch } from "vue";
import VInput from "./components/V-Input.vue";
import {
  GeneratedImageData,
  naiveUiThemeOverrides,
  PayloadToQueueImage,
  Size,
  DATE_FORMAT,
  DEFAULT_PROMPT,
} from "./constants";
import {
  useClipboard,
  useDark,
  useColorMode,
  useIntervalFn,
  useDateFormat,
} from "@vueuse/core";
import { sizes } from "./constants";
import { MisuseOutline, VolumeFileStorage } from "@vicons/carbon";
import {
  darkTheme,
  NConfigProvider,
  NInputGroup,
  NCheckbox,
  NUpload,
  NText,
  NP,
  NUploadDragger,
  NButton,
  NInputNumber,
  NInput,
  NSlider,
  UploadFileInfo,
} from "naive-ui";
import { useQueueStore } from "./store/queue";
import { useImageStore } from "./store/images";
import { storeToRefs } from "pinia";
import {
  downloadImage,
  generateRandomSeed,
  generateUUID,
  getDuration,
  getTimeAgo,
  isServerOnline,
} from "./functions";
import { useConfigsStore } from "./store/configs";

const queueStore = useQueueStore();
const { running, items, first } = storeToRefs(queueStore);

const imagesStore = useImageStore();
const { images } = storeToRefs(imagesStore);

const configsStore = useConfigsStore();
const { guidance, height, width, seed, steps } = storeToRefs(configsStore);

const mode = useColorMode();
onMounted(() => {
  mode.value = "dark";
});

const sizeOptions = sizes.map((size: Size) => ({
  value: `${size}` as const,
  text: `${size}` as const,
}));

const { copy } = useClipboard();
const copyPromptToClipboard = async () => {
  await copy(prompt.value);
};

const prompt = ref(DEFAULT_PROMPT);
const minSteps = 1;
const maxSteps = 300;

const isImage2image = ref(false);
const isUsingMask = ref(false);

const img2imgFile = ref<string | ArrayBuffer | null>(null);
const maskFile = ref<string | null>(null);
const img2imgPromptStrength = ref(0.8);

const setImage2ImagePrompt = (e: Event) => {
  const eventTarget = e.target as HTMLInputElement;
  if(!eventTarget || !eventTarget?.files?.length) {
    return;
  }

  const fileReader = new FileReader()
  fileReader.onloadend = () => {
    img2imgFile.value = fileReader.result;
  }
  fileReader.readAsDataURL(eventTarget.files[0])
}

const minGuidance = 1;
const maxGuidance = 20;
const guidanceStep = 0.1;

const imagesToGenerate = ref(1);

const handleFormSubmit = async () => {
  queueStore.addToQueue(prompt.value, imagesToGenerate.value);
  queueStore.execute();
};
const { isOnline } = isServerOnline();

watch(isImage2image, (newValue) => {
  if (!newValue) {
    isUsingMask.value = false;
  }
});

const handleDownloadImage = (image: GeneratedImageData) => {
  if (!image.image) {
    return;
  }
  downloadImage(image.image, `${image.createdAt}-${image.id}`);
};

useIntervalFn(() => {
  queueStore.execute();
}, 500);
</script>
<style lang="scss">
:root {
  color-scheme: dark;
}
#vaisd-app-container {
  @apply text-white;

  .title {
    @apply text-lg font-bold;
  }
}

.image-view {
  @apply border-2 border-transparent hover:(border-blue-900 cursor-pointer) transition-colors
  @apply w-[256px] h-[256px] min-w-[256px] min-h-[256px];
  @apply xl:(w-[512px] h-[512px] min-w-[512px] min-h-[512px]);
}

.sd-settings {
  @apply flex flex-row flex-wrap gap-4 px-1 xl:(justify-between);
  > * {
    @apply <md:(w-12/12) md:(w-6/12 -mx-1 -mb-1) xl:(w-2/12);
  }
}
</style>
