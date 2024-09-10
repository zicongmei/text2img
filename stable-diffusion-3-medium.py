import torch
import time
from diffusers import StableDiffusion3Pipeline
from pathlib import Path

access_token = Path("token").read_text().strip()

pipe = StableDiffusion3Pipeline.from_pretrained(
    "stabilityai/stable-diffusion-3-medium-diffusers",
    torch_dtype=torch.float16,
    token=access_token)
pipe = pipe.to("cuda")

prompt = input("stable-diffusion-3-medium-diffusers> ")


start_time = time.time()
image = pipe(
    prompt,
    negative_prompt="",
    num_inference_steps=28,
    guidance_scale=7.0,
).images[0]

print("--- stable-diffusion-3-medium-diffusers: %s seconds ---" %
      (time.time() - start_time))
image.save("stable-diffusion-3-medium-diffusers.png")
