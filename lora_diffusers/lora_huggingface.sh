# https://machinelearningmastery.com/fine-tuning-stable-diffusion-with-lora/

export MODEL_NAME="stable-diffusion-v1-5/stable-diffusion-v1-5"
export OUTPUT_DIR="./finetune_lora/pokemon"
export HUB_MODEL_ID="pokemon-lora"
export DATASET_NAME="svjack/pokemon-blip-captions-en-zh"

mkdir -p $OUTPUT_DIR

accelerate launch --mixed_precision="bf16"  train_text_to_image_lora.py \
  --pretrained_model_name_or_path=$MODEL_NAME \
  --dataset_name=$DATASET_NAME \
  --dataloader_num_workers=8 \
  --resolution=512 \
  --center_crop \
  --random_flip \
  --train_batch_size=1 \
  --gradient_accumulation_steps=4 \
  --max_train_steps=15000 \
  --learning_rate=1e-04 \
  --max_grad_norm=1 \
  --lr_scheduler="cosine" \
  --lr_warmup_steps=0 \
  --output_dir=${OUTPUT_DIR} \
  --checkpointing_steps=500 \
  --caption_column="en_text" \
  --validation_prompt="A pokemon with blue eyes." \
  --seed=1337