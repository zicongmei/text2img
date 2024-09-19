from diffusers import StableVideoDiffusionPipeline
import torch
import imageio
from PIL import Image

# Load the model
pipe = StableVideoDiffusionPipeline.from_pretrained(
    "stabilityai/stable-video-diffusion-img2vid",
    torch_dtype=torch.float16,
    variant="fp16",
)
pipe = pipe.to("cuda")


init_image = Image.open("stable-diffusion-v1-5.png")

# Generate the video
video_frames = pipe(init_image, num_frames=24, num_inference_steps=25).frames


imageio.mimsave("stable-video-diffusion-img2vid-xt.mp4", video_frames, fps=8)
