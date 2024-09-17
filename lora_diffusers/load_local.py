import torch
import time
from diffusers import DiffusionPipeline
from pathlib import Path
import sys

base_model = sys.argv[2]

pipe = DiffusionPipeline.from_pretrained(
    base_model,
    torch_dtype=torch.float16,
    safety_checker=None,
).to("cuda")

pipe.unet.load_attn_procs("./models/pytorch_lora_weights.safetensors")

# prompt = input("lora-local > ")
prompt = sys.argv[1]

print("prompt: ", prompt)


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
