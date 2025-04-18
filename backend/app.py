from flask import Flask, request, jsonify
from PIL import Image
import torch
from transformers import Blip2Processor, Blip2ForConditionalGeneration
import io
import traceback
from flask_cors import CORS


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})


device = "cuda" if torch.cuda.is_available() else "cpu"
processor = Blip2Processor.from_pretrained("Salesforce/blip2-opt-2.7b")
model = Blip2ForConditionalGeneration.from_pretrained(
    "Salesforce/blip2-opt-2.7b",
    torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
).to(device)

if torch.cuda.is_available():
    print(f"GPU Memory Allocated: {torch.cuda.memory_allocated()}")
    print(f"GPU Memory Cached: {torch.cuda.memory_reserved()}")


def generate_caption(image):
    try:
        prompt = "What is the road damage in this image?"
        print("📐 Resizing image...")
        image = image.resize((512, 512))
        
        print("📦 Preparing inputs...")
        inputs = processor(images=image, text=prompt, return_tensors="pt").to(device)

        print("🧠 Running model.generate...")
        output = model.generate(**inputs, max_new_tokens=100)

        print("📤 Decoding output...")
        caption = processor.tokenizer.decode(output[0], skip_special_tokens=True).strip()

        if caption.lower().strip() in ["", prompt.lower().strip()]:
            caption = "[Model failed to generate meaningful caption]"

        return caption

    except Exception as e:
        print("🚨 generate_caption() error:", e)
        raise  # So Flask can catch and return the error



def generate_summary(caption):
    caption_lower = caption.lower()
    if "pothole" in caption_lower:
        return "Pothole detected", "High" if "deep" in caption_lower else "Low", "Urgent" if "center" in caption_lower else "Low"
    elif "crack" in caption_lower:
        return "Crack detected", "Medium" if "long" in caption_lower else "Low", "Moderate"
    elif "debris" in caption_lower:
        return "Debris detected", "Low", "Moderate"
    elif "blocked" in caption_lower or "collapsed" in caption_lower:
        return "Roadblock detected", "High", "Critical"
    elif caption == "[Model failed to generate meaningful caption]":
        return "Unknown detected", "Unknown", "Unknown"
    else:
        return "General damage detected", "Medium", "Moderate"


@app.route('/analyze', methods=['POST'])
def analyze():
    print("✅ /analyze endpoint hit")
    print("Request.files:", request.files)

    if 'image' not in request.files:
        print("❌ No image in request.files")
        return jsonify({'error': 'No image provided'}), 400
    
    # if image.format not in ['JPEG', 'PNG']:
    #     print(f"❌ Unsupported image format: {image.format}")
    #     return jsonify({'error': 'Unsupported image format'}), 400

    # print(f"✅ Image format is {image.format}, proceeding with processing...")


    file = request.files['image']
    print(f"📸 Received image: {file.filename}, Size: {len(file.read())} bytes")
    file.seek(0) 

    try:
        # Rewind file to start reading it again
        image_bytes = file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        print("✅ Image successfully loaded and converted")

        print("🤖 Generating caption...")
        caption = generate_caption(image)
        print("✅ Caption generated:", caption)

        print("📊 Generating summary...")
        damage_type, severity, priority = generate_summary(caption)
        summary = f"{damage_type}. Severity: {severity}. Priority: {priority}."
        print("✅ Summary complete:", summary)

        return jsonify({'caption': caption, 'summary': summary})

    except Exception as e:
        print("🔥 Exception caught during processing:", str(e))
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500
    


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)
