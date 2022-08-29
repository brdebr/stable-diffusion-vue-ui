import { API_GENERATE_HEALTH, API_GENERATE_IMAGE_URL, GeneratedImageData } from "./constants"

export type GeneratedImageDataPayload = {
  input: {
    prompt: string;
    num_outputs: number,
    num_inference_steps: number,
    width: number,
    height: number,
    seed: number,
    guidance_scale: number,
  }
}

export type GenerateImageResponseType = {
  status: string;
  output: string[];
}

// turn GeneratedImageData into GeneratedImageDataPayload
export const buildGenerateImagePayload = (data: GeneratedImageData) => {
  return {
    guidance_scale: parseFloat(data.guidance),
    height: data.height,
    num_inference_steps: data.steps,
    num_outputs: 1,
    prompt: data.prompt,
    seed: parseInt(data.seed) || '-1',
    width: data.width,
  }
}

export const generateImage = async (data: GeneratedImageData) => {
  try {
    // @ts-expect-error This is to allow the user to override the API endpoint
    const response = await fetch(window.SD_URL || API_GENERATE_IMAGE_URL, {
      method: 'POST',
      mode: "cors",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(buildGenerateImagePayload(data)),
    })
    const responseData: GenerateImageResponseType = await response.json()
    const imageBase64String = responseData.output[0];
    return imageBase64String;
  } catch (error) {
    console.log(error)
  }
}

export const checkServer = async () => {
  // @ts-expect-error This is to allow the user to override the API endpoint
  const response = await fetch(window.SD_URL || API_GENERATE_HEALTH);
  const responseData = await response.json();
  return responseData[0] === 'OK';
}