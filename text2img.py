import torch
import time
from accelerate import Accelerator
from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler, StableDiffusion3Pipeline


class Text2Img:
    def __init__(self, model_id, access_token=None):
        self.model_id = model_id
        self.model_name = model_id.split('/')[1]
        
        num_gpus = torch.cuda.device_count()
        print(f"Number of GPUs available: {num_gpus}")

        # Initialize the accelerator
        accelerator = Accelerator()
        try:
            self.pipe = StableDiffusionPipeline.from_pretrained(
                self.model_id,
                torch_dtype=torch.float16,
                token=access_token)
        except:
            self.pipe = StableDiffusion3Pipeline.from_pretrained(
                self.model_id,
                torch_dtype=torch.float16,
                token=access_token,
                device_map="balanced",
                )

        self.pipe.scheduler = DPMSolverMultistepScheduler.from_config(
            self.pipe.scheduler.config)
        
        self.pipe = accelerator.prepare(self.pipe)


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


def run_once(model_id, token=None):
    s = Text2Img(model_id, token)
    prompt = input(s.model_name+"> ")
    return s.generate(prompt)


def run(model_id, token=None):
    s = Text2Img(model_id, token)

    while True:
        prompt = input(s.model_name+"> ")
        s.generate(prompt)
