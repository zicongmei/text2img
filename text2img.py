import torch
import time
from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler


class Text2Img:
    def __init__(self, model_id):
        self.model_id = model_id
        self.model_name = model_id.split('/')[1]
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
        print("--- "+self.model_name+": %s seconds ---" %
              (time.time() - start_time))

        image.save(self.model_name+".png")
        return image


def run_once(model_id):
    s = Text2Img(model_id)
    prompt = input(s.model_name+"> ")
    return s.generate(prompt)


def run(model_id):
    s = Text2Img(model_id)

    while True:
        prompt = input(s.model_name+"> ")
        s.generate(prompt)
