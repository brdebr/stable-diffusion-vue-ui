import json
import requests
import base64
import uuid
import time
import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse
from pydantic import BaseModel

import requests

LOCAL_SERVER_URL = 'http://stability-ai:5000'
PREDICT_URL = LOCAL_SERVER_URL + '/predictions'
OUTPUT_DIR = "/app/generated/data"

app = FastAPI()

api = FastAPI(root_path="/api")
app.mount("/api", api)

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# defaults from https://huggingface.co/blog/stable_diffusion
class ImageRequest(BaseModel):
    prompt: str
    prompt_text: str
    prompt_modifiers: list
    init_image: str = None # base64
    mask: str = None # base64
    num_outputs: str = "1"
    num_inference_steps: str = "50"
    guidance_scale: str = "7.5"
    width: str = "512"
    height: str = "512"
    seed: str = "30000"
    prompt_strength: str = "0.8"


@api.get('/server_status')
async def ping():
    try:
        requests.get(LOCAL_SERVER_URL)
        return {'OK'}
    except:
        return {'ERROR'}

@api.post('/generate_image')
async def image(req : ImageRequest):
    data = {
        "input": {
            "prompt": req.prompt,
            "num_outputs": req.num_outputs,
            "num_inference_steps": req.num_inference_steps,
            "width": req.width,
            "height": req.height,
            "seed": req.seed,
            "guidance_scale": req.guidance_scale,
        }
    }
    # check how much time it takes to generate the image
    start_time = time.time()

    if req.init_image is not None:
        data['input']['init_image'] = req.init_image
        data['input']['prompt_strength'] = req.prompt_strength

        if req.mask is not None:
            data['input']['mask'] = req.mask

    if req.seed == "-1":
        del data['input']['seed']

    res = requests.post(PREDICT_URL, json=data)
    if res.status_code != 200:
        raise HTTPException(status_code=500, detail=res.text)

    resObj = res.json()

    epoch_time = int(time.time())

    uuid_str = str(uuid.uuid4())
    unique_filename = f'{epoch_time}-{req.seed}-{uuid_str}'
    file_destiny = f'{OUTPUT_DIR}/file/{unique_filename}'
    meta_file_destiny = f'{OUTPUT_DIR}/meta/{unique_filename}'
    metadata_extension = '.json'
    image_extension = '.png'

    file_path = f'{file_destiny}{image_extension}'
    metadata_file_path = f'{meta_file_destiny}{metadata_extension}'

    resObj['uuid'] = uuid_str
    resObj['epoch_time'] = epoch_time
    resObj['filename'] = f'{unique_filename}{image_extension}'
    resObj['prompt_text'] = req.prompt_text
    resObj['prompt_modifiers'] = req.prompt_modifiers
    resObj['elapsed_time'] = time.time() - start_time

    # merge data with resObj without output
    finalObj = {**data['input'], **resObj}
    finalObj.pop('output', None)

    # create directory if it doesn't exist and create the metadata file
    os.makedirs(os.path.dirname(metadata_file_path), exist_ok=True)
    with open(metadata_file_path, 'w') as f:
        json.dump(finalObj, f)

    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, "wb") as fh:
        data_img = resObj['output'][0].replace("data:image/png;base64,", "")
        fh.write(base64.b64decode(data_img))

    return finalObj


app.mount("/ai-images/", StaticFiles(directory="generated", html = True), name="static")

app.mount("/", StaticFiles(directory="static", html = True), name="static")