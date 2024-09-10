import torch
import time
from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler


def stable2():
    model_id = "stabilityai/stable-diffusion-2-1"

    # Use the DPMSolverMultistepScheduler (DPM-Solver++) scheduler here instead
    pipe = StableDiffusionPipeline.from_pretrained(
        model_id, torch_dtype=torch.float16)
    pipe.scheduler = DPMSolverMultistepScheduler.from_config(
        pipe.scheduler.config)
    pipe = pipe.to("cuda")

    prompt = input("stable-diffusion-2-1> ")

    start_time = time.time()
    image = pipe(prompt).images[0]
    print("--- stable-diffusion-2-1: %s seconds ---" %
          (time.time() - start_time))

    image.save("stable-diffusion-2-1.png")
    return image


stable2()
