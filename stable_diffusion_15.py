import text2img

model_id = "stable-diffusion-v1-5"


def run():
    text2img.run(model_id=model_id)


if __name__ == "__main__":
    run()
