<template>
  <n-config-provider
    :theme="darkTheme"
    :theme-overrides="naiveUiThemeOverrides"
  >
    <div id="vaisd-app-container" class="container mx-auto p-8">
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
              <button
                class="border text-xs py-1 px-2 bg-blue-900"
                type="button"
                @click="copyPromptToClipboard"
              >
                Copy to clipboard
              </button>
            </template>
          </v-input>
        </form>
        <hr class="my-3" />
        <div class="sd-settings">
          <v-input input-id="seed" v-model="seed" label="Seed" type="text" />
          <v-input input-id="steps" v-model="steps" label="Steps" type="text" />
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
              class="flex border"
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
                    <span>
                      guidance
                    </span>
                    <span>
                      {{ image.guidance }}
                    </span>
                  </div>
                  <div>
                    <span>
                      steps
                    </span>
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
import { onMounted, reactive, ref } from "vue";
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
import { MisuseOutline } from "@vicons/carbon";
import {
  darkTheme,
  NConfigProvider,
  NInputGroup,
  NButton,
  NInputNumber,
  NInput,
  NSlider,
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

const minGuidance = 0;
const maxGuidance = 20;
const guidanceStep = 0.1;

const imagesToGenerate = ref(1);

const handleFormSubmit = async () => {
  queueStore.addToQueue(prompt.value, imagesToGenerate.value);
  queueStore.execute();
};
const { isOnline } = isServerOnline();

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
  @apply lg:(w-[256px] h-[256px] min-w-[256px] min-h-[256px]);
  @apply xl:(w-[512px] h-[512px] min-w-[512px] min-h-[512px]);
}

.sd-settings {
  @apply flex flex-row flex-wrap gap-4 px-1 xl:(justify-between);
  > * {
    @apply <md:(w-12/12) md:(w-6/12 -mx-1 -mb-1) xl:(w-2/12);
  }
}
</style>
