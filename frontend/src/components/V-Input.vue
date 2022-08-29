<template>
  <div class="vaisd-input-component">
    <label class="flex flex-wrap relative">
      <div class="w-full flex gap-1 justify-between items-center mb-3">
        <span data-test="label">
          {{ label }}
        </span>
        <slot name="append-label"></slot>
      </div>
      <n-input
        v-if="type === 'text'"
        v-model:value="modelValue"
        type="text"
        :placeholder="label"
      />
      <n-input
        v-if="type === 'textarea'"
        v-model:value="modelValue"
        type="textarea"
        :placeholder="label"
        :show-count="counter"
      >
        <template #count="{ value }">
          {{ value.length }}
        </template>
      </n-input>
      <n-select
        v-else-if="type === 'select'"
        v-model:value="modelValue"
        label-field="text"
        value-field="value"
        :options="options"
      />
    </label>
  </div>
</template>
<script setup lang="ts">
import { PropType, ref, watch } from "vue";
import { NSelect, NInput } from "naive-ui";
import { naiveUiThemeOverrides } from "../constants";

const props = defineProps({
  inputId: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    default: "",
  },
  modelValue: {
    type: String,
    required: true,
  },
  type: {
    type: String as PropType<"text" | "textarea" | "select">,
    default: "text",
  },
  options: {
    type: Array as PropType<{ value: string; text: string }[]>,
  },
  counter: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);

const themeOverrides = naiveUiThemeOverrides;

const modelValue = ref(props.modelValue);

watch(modelValue, (newModelValue) => {
  emit("update:modelValue", newModelValue);
});
</script>
<style lang="scss">
.vaisd-input-component {
  [data-test="label"] {
    @apply text-white text-opacity-80;
  }

  input,
  select,
  textarea {
    @apply border-2 border-gray-200 rounded-lg p-2;
    @apply bg-transparent;
  }
}
</style>
