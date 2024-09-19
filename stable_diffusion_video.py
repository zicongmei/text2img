from diffusers import StableVideoDiffusionPipeline
import torch
import imageio

# Load the model
pipe = StableVideoDiffusionPipeline.from_pretrained(
    "stabilityai/stable-video-diffusion-img2video-xt",
    torch_dtype=torch.float16,
    variant="fp16",
)
pipe = pipe.to("cuda")

# Load the initial image (ensure it's the correct path)
init_image = load_image("/path/to/your/image.jpg").convert("RGB")

# Generate the video
video_frames = pipe(init_image, num_frames=24, num_inference_steps=25).frames


imageio.mimsave("generated_video.mp4", video_frames, fps=8)
