import torch
import time
from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler

model_name = "stable-diffusion-v1-5"


class Stable15:
    def __init__(self):
        self.model_id = "runwayml/"+model_name
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


def stable15():
    s = Stable15()
    prompt = input(model_name+"> ")

    return s.generate(prompt)


def run():
    s = Stable15()

    while True:
        prompt = input(model_name+"> ")
        s.generate(prompt)


if __name__ == "__main__":
    run()
