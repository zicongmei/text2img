import torch
from diffusers import FluxPipeline


pipe = FluxPipeline.from_pretrained(
    "Shakker-Labs/AWPortrait-FL", torch_dtype=torch.bfloat16)
pipe.to("cuda")

prompt = input("> ")

start_time = time.time()
image = pipe(prompt,
             num_inference_steps=24,
             guidance_scale=3.5,
             width=768, height=1024,
             ).images[0]
print("--- %s seconds ---" %
      (time.time() - start_time))
image.save("AWPortrait-FL.png")
