import text2img

model_id = "stabilityai/stable-diffusion-2-1"


def run():
    text2img.run(model_id=model_id)


if __name__ == "__main__":
    run()
