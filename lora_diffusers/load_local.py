import torch
import time
from diffusers import DiffusionPipeline
from pathlib import Path

base_model = "CompVis/stable-diffusion-v1-4"

pipe = DiffusionPipeline.from_pretrained(
    base_model,
    torch_dtype=torch.float16,
    safety_checker=None,
).to("cuda")

pipe.unet.load_attn_procs("./models/pytorch_lora_weights.safetensors")

prompt = input("lora-local > ")


start_time = time.time()
image = pipe(
    prompt,
    negative_prompt="",
    num_inference_steps=28,
    guidance_scale=7.0,
).images[0]

print("--- lora local: %s seconds ---" %
      (time.time() - start_time))
image.save("lora_local.png")
