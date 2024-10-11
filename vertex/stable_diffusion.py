import pandas as pd
from vertexai.language_models import TextGenerationModel
from google.cloud import aiplatform

SERVE_DOCKER_URI= "us-docker.pkg.dev/deeplearning-platform-release/vertex-model-garden/pytorch-inference.cu125.0-1.ubuntu2204.py310"

def deploy_model(model_id, task):
  """Create a Vertex AI Endpoint and deploy the specified model to the endpoint."""

  # Create endpoint.
  model_name = "stable-diffusion-xl-base-1.0"
  endpoint = aiplatform.Endpoint.create(display_name=f"{model_name}-{task}-endpoint")
  serving_env = {
      "MODEL_ID": model_id,
      "TASK": task,
      "DEPLOY_SOURCE": "custom",
  }

  # Upload model.
  model = aiplatform.Model.upload(
      display_name=model_name,
      serving_container_image_uri=SERVE_DOCKER_URI,
      serving_container_ports=[7080],
      serving_container_predict_route="/predict",
      serving_container_health_route="/health",
      serving_container_environment_variables=serving_env,
  )

  # Deploy model.
  machine_type = "g2-standard-8"
  accelerator_type = "NVIDIA_L4"
  model.deploy(
      endpoint=endpoint,
      machine_type=machine_type,
      accelerator_type=accelerator_type,
      accelerator_count=1,
      deploy_request_timeout=1800,
    #   service_account=SERVICE_ACCOUNT,
  )
  return model, endpoint

model, endpoint = deploy_model(
    model_id="stabilityai/stable-diffusion-xl-base-1.0",
    task="text-to-image-sdxl"
)

PROJECT_ID = "zicong-gke-multi-cloud-dev-2"
output_file = "output-image.png"
prompt = "a person riding bike" # The text prompt describing what you want to see.


images = model.generate_images(
    prompt=prompt,
    # Optional parameters
    number_of_images=1,
    language="en",
    # You can't use a seed value and watermark at the same time.
    # add_watermark=False,
    # seed=100,
    aspect_ratio="1:1",
    safety_filter_level="block_some",
    person_generation="allow_adult",
)

images[0].save(location=output_file, include_generation_parameters=False)

# Optional. View the generated image in a notebook.
# images[0].show()
print(f"Created output image using {len(images[0]._image_bytes)} bytes")
# Example response:
# Created output image using 1234567 bytes

