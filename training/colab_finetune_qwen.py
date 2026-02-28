"""
=============================================================================
QWEN 2.5 1.5B FINE-TUNING FOR QUESTION GENERATION (Google Colab)
=============================================================================

Instructions:
1. Upload this script to Google Colab
2. Upload your training data (train.jsonl, val.jsonl) to Colab
3. Run all cells
4. Download the fine-tuned adapter

Requirements: Free Colab GPU (T4 is sufficient)
Training time: ~1-2 hours for full dataset
"""

# =============================================================================
# CELL 1: Install Dependencies
# =============================================================================
# Run this cell first

!pip install -q transformers>=4.36.0
!pip install -q datasets
!pip install -q accelerate
!pip install -q peft>=0.7.0
!pip install -q bitsandbytes>=0.41.0
!pip install -q trl>=0.7.0
!pip install -q torch>=2.0.0

import torch
print(f"PyTorch version: {torch.__version__}")
print(f"CUDA available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")
    print(f"Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")

# =============================================================================
# CELL 2: Import Libraries
# =============================================================================

import os
import json
from datasets import Dataset, load_dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    TrainingArguments,
    pipeline,
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from trl import SFTTrainer

# =============================================================================
# CELL 3: Configuration
# =============================================================================

# Model configuration
MODEL_NAME = "Qwen/Qwen2.5-1.5B-Instruct"  # Using instruction-tuned variant
OUTPUT_DIR = "./qwen-qpg-finetuned"
MAX_SEQ_LENGTH = 512

# Training configuration
EPOCHS = 3
BATCH_SIZE = 4  # Adjust based on GPU memory
GRADIENT_ACCUMULATION = 4
LEARNING_RATE = 2e-4
WARMUP_RATIO = 0.03

# LoRA configuration
LORA_R = 16
LORA_ALPHA = 32
LORA_DROPOUT = 0.05

print("Configuration loaded!")

# =============================================================================
# CELL 4: Load and Prepare Data
# =============================================================================

def load_training_data(train_file="train.jsonl", val_file="val.jsonl"):
    """Load training data from JSONL files"""
    
    def load_jsonl(filepath):
        data = []
        with open(filepath, 'r', encoding='utf-8') as f:
            for line in f:
                data.append(json.loads(line))
        return data
    
    train_data = load_jsonl(train_file)
    val_data = load_jsonl(val_file) if os.path.exists(val_file) else []
    
    print(f"Loaded {len(train_data)} training examples")
    print(f"Loaded {len(val_data)} validation examples")
    
    return train_data, val_data


def format_for_training(example):
    """Format example into chat template"""
    messages = example["messages"]
    
    # Build the prompt string
    formatted = ""
    for msg in messages:
        role = msg["role"]
        content = msg["content"]
        
        if role == "system":
            formatted += f"<|im_start|>system\n{content}<|im_end|>\n"
        elif role == "user":
            formatted += f"<|im_start|>user\n{content}<|im_end|>\n"
        elif role == "assistant":
            formatted += f"<|im_start|>assistant\n{content}<|im_end|>\n"
    
    return {"text": formatted}


# Load data
print("\nLoading training data...")
train_data, val_data = load_training_data()

# Convert to datasets
train_dataset = Dataset.from_list(train_data)
val_dataset = Dataset.from_list(val_data) if val_data else None

# Format for training
train_dataset = train_dataset.map(format_for_training)
if val_dataset:
    val_dataset = val_dataset.map(format_for_training)

print(f"\nSample formatted text:\n{train_dataset[0]['text'][:500]}...")

# =============================================================================
# CELL 5: Load Model with Quantization
# =============================================================================

print("\nLoading model with 4-bit quantization...")

# Quantization config for QLoRA
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_use_double_quant=True,
)

# Load model
model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    quantization_config=bnb_config,
    device_map="auto",
    trust_remote_code=True,
)

# Load tokenizer
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)
tokenizer.pad_token = tokenizer.eos_token
tokenizer.padding_side = "right"

print(f"Model loaded: {MODEL_NAME}")
print(f"Model parameters: {model.num_parameters():,}")

# =============================================================================
# CELL 6: Configure LoRA
# =============================================================================

print("\nConfiguring LoRA...")

# Prepare model for k-bit training
model = prepare_model_for_kbit_training(model)

# LoRA configuration
lora_config = LoraConfig(
    r=LORA_R,
    lora_alpha=LORA_ALPHA,
    lora_dropout=LORA_DROPOUT,
    bias="none",
    task_type="CAUSAL_LM",
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
)

# Apply LoRA
model = get_peft_model(model, lora_config)

# Print trainable parameters
trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
total_params = sum(p.numel() for p in model.parameters())
print(f"Trainable parameters: {trainable_params:,} ({100 * trainable_params / total_params:.2f}%)")

# =============================================================================
# CELL 7: Training Arguments
# =============================================================================

training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    num_train_epochs=EPOCHS,
    per_device_train_batch_size=BATCH_SIZE,
    per_device_eval_batch_size=BATCH_SIZE,
    gradient_accumulation_steps=GRADIENT_ACCUMULATION,
    learning_rate=LEARNING_RATE,
    warmup_ratio=WARMUP_RATIO,
    logging_steps=10,
    save_steps=100,
    save_total_limit=2,
    evaluation_strategy="steps" if val_dataset else "no",
    eval_steps=100 if val_dataset else None,
    fp16=True,
    optim="paged_adamw_8bit",
    report_to="none",  # Disable wandb
    gradient_checkpointing=True,
)

print("Training arguments configured!")

# =============================================================================
# CELL 8: Initialize Trainer and Train
# =============================================================================

print("\nInitializing trainer...")

trainer = SFTTrainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=val_dataset,
    tokenizer=tokenizer,
    dataset_text_field="text",
    max_seq_length=MAX_SEQ_LENGTH,
    packing=False,
)

print("\n" + "="*60)
print("STARTING TRAINING")
print("="*60)
print(f"Epochs: {EPOCHS}")
print(f"Batch size: {BATCH_SIZE}")
print(f"Gradient accumulation: {GRADIENT_ACCUMULATION}")
print(f"Effective batch size: {BATCH_SIZE * GRADIENT_ACCUMULATION}")
print("="*60 + "\n")

# Train!
trainer.train()

print("\n" + "="*60)
print("TRAINING COMPLETE!")
print("="*60)

# =============================================================================
# CELL 9: Save the Fine-tuned Model
# =============================================================================

print("\nSaving fine-tuned adapter...")

# Save the LoRA adapter
adapter_path = os.path.join(OUTPUT_DIR, "final_adapter")
model.save_pretrained(adapter_path)
tokenizer.save_pretrained(adapter_path)

print(f"Adapter saved to: {adapter_path}")

# Create a zip file for easy download
!cd {OUTPUT_DIR} && zip -r ../qwen_qpg_adapter.zip final_adapter/

print("\nDownload 'qwen_qpg_adapter.zip' from the file browser!")

# =============================================================================
# CELL 10: Test the Fine-tuned Model
# =============================================================================

print("\n" + "="*60)
print("TESTING FINE-TUNED MODEL")
print("="*60)

# Test prompt
test_prompt = """<|im_start|>system
You are an expert exam question generator for C Programming. Generate questions that:
1. Follow Bloom's Taxonomy levels strictly
2. Match the specified marks and complexity
3. Use proper academic language
4. Are clear and unambiguous<|im_end|>
<|im_start|>user
Generate a 5-mark exam question for C Programming.

Requirements:
- Unit: 2
- Topic: loops
- Bloom's Level: K3 (Apply)
- Marks: 5

Generate only the question text, nothing else.<|im_end|>
<|im_start|>assistant
"""

# Generate
inputs = tokenizer(test_prompt, return_tensors="pt").to(model.device)
outputs = model.generate(
    **inputs,
    max_new_tokens=150,
    temperature=0.7,
    top_p=0.9,
    do_sample=True,
    pad_token_id=tokenizer.eos_token_id,
)

response = tokenizer.decode(outputs[0], skip_special_tokens=False)

# Extract just the generated part
generated = response.split("<|im_start|>assistant\n")[-1].split("<|im_end|>")[0]

print(f"\nGenerated Question:\n{generated}")

# Test multiple prompts
test_cases = [
    {"unit": 1, "marks": 2, "bloom": "K1", "topic": "tokens"},
    {"unit": 3, "marks": 5, "bloom": "K3", "topic": "arrays"},
    {"unit": 4, "marks": 12, "bloom": "K6", "topic": "structures"},
]

print("\n" + "="*60)
print("ADDITIONAL TEST CASES")
print("="*60)

for test in test_cases:
    prompt = f"""<|im_start|>system
You are an expert exam question generator for C Programming.<|im_end|>
<|im_start|>user
Generate a {test['marks']}-mark exam question for C Programming.
Unit: {test['unit']}, Topic: {test['topic']}, Bloom's Level: {test['bloom']}
Generate only the question text.<|im_end|>
<|im_start|>assistant
"""
    
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    outputs = model.generate(
        **inputs,
        max_new_tokens=150,
        temperature=0.7,
        do_sample=True,
        pad_token_id=tokenizer.eos_token_id,
    )
    
    response = tokenizer.decode(outputs[0], skip_special_tokens=False)
    generated = response.split("<|im_start|>assistant\n")[-1].split("<|im_end|>")[0]
    
    print(f"\n[Unit {test['unit']}, {test['marks']} marks, {test['bloom']}]")
    print(f"Q: {generated.strip()}")

print("\n" + "="*60)
print("ALL DONE!")
print("="*60)
print("\nNext steps:")
print("1. Download 'qwen_qpg_adapter.zip'")
print("2. Extract and copy to your local project")
print("3. Load with: model = AutoModelForCausalLM.from_pretrained(...)")
print("4. Apply adapter with: model = PeftModel.from_pretrained(model, adapter_path)")
