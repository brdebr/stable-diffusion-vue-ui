import { defineStore } from "pinia"
import { generateImage } from "../api";
import { GeneratedImageData } from "../constants"

type ImagesStateType = {
  images: GeneratedImageData[];
}

export const useImageStore = defineStore('image', {
  state: (): ImagesStateType => ({
    images: [],
  }),
  actions: {
    addImage(item: GeneratedImageData) {
      this.$state.images.unshift(item);
    },
  },
})