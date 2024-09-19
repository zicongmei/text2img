from pathlib import Path
import text2img

model_id = "stabilityai/stable-diffusion-3-medium-diffusers"

access_token = Path("/cert/hg_token").read_text().strip()

print("token=", access_token)


def run():
    text2img.run(model_id=model_id, token=access_token)


if __name__ == "__main__":
    run()
