
#/bin/bash

set -ex

git clone https://github.com/shirayu/example_lora_training.git || echo "git done"

LABEL="KVWAG" 

# BASE_MODEL="CompVis/stable-diffusion-v1-4"
BASE_MODEL="JosephusCheung/ACertainty"
BASE_MODEL="stable-diffusion-v1-5/stable-diffusion-v1-5"

rm -rf models || echo "dir not exist"

accelerate launch train_dreambooth_lora.py \
  --pretrained_model_name_or_path=$BASE_MODEL  \
  --instance_data_dir="example_lora_training/diffusers_lora_example/img_train_512x512" \
  --output_dir="models" \
  --instance_prompt="${LABEL}" \
  --resolution=512 \
  --train_batch_size=1 \
  --gradient_accumulation_steps=1 \
  --checkpointing_steps=100 \
  --learning_rate=1e-4 \
  --lr_scheduler="constant" \
  --lr_warmup_steps=0 \
  --max_train_steps=500 \
  --validation_epochs=50 \
  --seed="0" \
  # --report_to="wandb" \
  # --validation_prompt="A photo of sks dog in a bucket" \


  python3 load_local.py ${LABEL} "${BASE_MODEL}"

  cp lora_local.png ~/html/
