import { NConfigProvider, GlobalThemeOverrides } from 'naive-ui'

export type GeneratedImageData = {
  id: string;
  prompt: string;
  seed: string;
  steps: string;
  guidance: string;
  width: string;
  height: string;
  createdAt: number;
  startedAt: number;
  queuedAt: number;
  elapsedMs: number;
  /**
   * result image in base64 format
   */
  image?: string;
  // img2img params ->
  init_image?: string;
  prompt_strength?: string;
  mask?: string;
};

type storedInPiniaParams =
  | 'seed'
  | 'steps'
  | 'guidance'
  | 'width'
  | 'height'

export type PayloadToQueueImage = Omit<GeneratedImageData, storedInPiniaParams>

export const DATE_FORMAT = 'DD/MM/YYYY - HH:mm:ss';

export const DEFAULT_SEED = '-1';
export const DEFAULT_GUIDANCE = 8;
export const DEFAULT_STEPS = 40;
export const DEFAULT_WIDTH = 512;
export const DEFAULT_HEIGHT = 512;
export const DEFAULT_PROMPT = 'concept art of a far-future city, key visual, summer day, highly detailed, digital painting, artstation, concept art, sharp focus, in harmony with nature, streamlined, by makoto shinkai and akihiko yoshida and hidari and wlop';

export const API_URL = '';
export const API_GENERATE_IMAGE_URL = `${API_URL}/api/generate_image` as const;
export const API_GENERATE_HEALTH = `${API_URL}/api/server_status` as const;

export const SOUNDS_MAP = {
  'server-online': '/sound/hangover-sound.mp3',
  'done': '/sound/notification-pretty-good.mp3',
  'one-image': '/sound/message-tone-checked-off.mp3',
}
export type SoundName = keyof typeof SOUNDS_MAP;


export const sizes = ["64", "128", "256", "512"] as const;
export type Size = typeof sizes[number];


export const naiveUiThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#DBE3F8',
    primaryColorHover: '#BFCCF1'
  },
}