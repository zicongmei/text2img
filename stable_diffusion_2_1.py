import torch
import time
from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler

model_name = "stable-diffusion-2-1"


class Stable21:
    def __init__(self):
        self.model_id = "stabilityai/"+model_name
        # Use the DPMSolverMultistepScheduler (DPM-Solver++) scheduler here instead
        self.pipe = StableDiffusionPipeline.from_pretrained(
            self.model_id, torch_dtype=torch.float16)
        self.pipe.scheduler = DPMSolverMultistepScheduler.from_config(
            self.pipe.scheduler.config)
        self.pipe = self.pipe.to("cuda")

    def generate(self, prompt):
        return self.generate_cfg(prompt=prompt, cfg_scale=7.0)

    def generate_cfg(self, prompt, cfg_scale):
        start_time = time.time()
        image = self.pipe(prompt,
                          guidance_scale=cfg_scale,
                          ).images[0]
        print("--- "+model_name+": %s seconds ---" %
              (time.time() - start_time))

        image.save(model_name+".png")
        return image


def stable2():
    s = Stable21()
    prompt = input(model_name+"> ")
    return s.generate(prompt)


stable2()
