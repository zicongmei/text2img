import torch
import time
from diffusers import DiffusionPipeline, DPMSolverMultistepScheduler
from pathlib import Path
import sys

base_model = sys.argv[2]

pipe = DiffusionPipeline.from_pretrained(
    base_model,
    torch_dtype=torch.float16,
    safety_checker=None,
).to("cuda")

pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config)

# pipe.unet.load_attn_procs("./models/pytorch_lora_weights.safetensors")
pipe.load_lora_weights("./models/pytorch_lora_weights.safetensors")

# prompt = input("lora-local > ")
prompt = sys.argv[1]

print("prompt: ", prompt)


start_time = time.time()
image = pipe(
    prompt,
    negative_prompt="",
    # num_inference_steps=150,
).images[0]

print("--- lora local: %s seconds ---" %
      (time.time() - start_time))
image.save("lora_local.png")
