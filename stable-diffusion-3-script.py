import torch
from diffusers import StableDiffusion3Pipeline, DPMSolverMultistepScheduler
from accelerate import Accelerator
from pathlib import Path

access_token = Path("/cert/hg_token").read_text().strip()


# Check for GPU availability
if torch.cuda.is_available():
    device = torch.device("cuda")
    num_gpus = torch.cuda.device_count()
    print(f"Using {num_gpus} GPUs!")
else:
    raise ValueError("No GPUs available. Stable Diffusion 3 requires GPU acceleration.")

# Initialize the accelerator
accelerator = Accelerator()

# Load the Stable Diffusion 3 pipeline
pipe = StableDiffusion3Pipeline.from_pretrained(
    "stabilityai/stable-diffusion-3-medium-diffusers",
    torch_dtype=torch.float16,  # Use float16 for memory efficiency
    variant="fp16",
    token=access_token,device_map="balanced",
)

pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config)
print("schedluer done")
# Prepare the model for multi-GPU training
pipe = accelerator.prepare(pipe)
print("prepare accelerator done")

print (pipe.hf_device_map)

#pipe = pipe.to(accelerator.device)
#print("pipe to GPU done")
# Generate an image
prompt = "A photorealistic image of a cat riding a unicorn on the moon."
print("creating image")
image = pipe(
  prompt,
  guidance_scale=7.0,
  num_inference_steps=100).images[0]

# Save the image
image.save("cat_unicorn_moon.png") 