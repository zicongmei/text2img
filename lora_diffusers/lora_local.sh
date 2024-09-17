
#/bin/bash

set -ex

git clone https://github.com/shirayu/example_lora_training.git || echo "git done"

LABEL="andy" 

accelerate launch \
    --num_processes 1 \
    --num_machines 1 \
    --mixed_precision "fp16" \
    --dynamo_backend "no" \
    train_dreambooth_lora.py \
    --pretrained_model_name_or_path="CompVis/stable-diffusion-v1-4" \
    --instance_data_dir="example_lora_training/diffusers_lora_example/img_train_512x512" \
    --output_dir="models" \
    --instance_prompt="${LABEL}" \
    --resolution=512 \
    --train_batch_size=1 \
    --sample_batch_size=1 \
    --gradient_accumulation_steps=1 \
    --gradient_checkpointing \
    --learning_rate=5e-6 \
    --lr_scheduler="constant" \
    --lr_warmup_steps=0 \
    --checkpointing_steps=100 \
    --mixed_precision=fp16 \
    --max_train_steps=1000


  python3 load_local.py ${LABEL}

  cp lora_local.png ~/html/