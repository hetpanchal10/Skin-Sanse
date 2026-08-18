import argparse
import json
from pathlib import Path

import torch
import torch.nn.functional as F
from PIL import Image
from torchvision import models, transforms


def build_model(num_classes: int) -> torch.nn.Module:
    model = models.efficientnet_b0(weights=None)
    in_features = model.classifier[1].in_features
    model.classifier[1] = torch.nn.Linear(in_features, num_classes)
    return model


# Updated to match your actual trained model filename
DEFAULT_MODEL_PATH = Path(__file__).parent / "skin_type_efficientnetb0.pt"
DEVICE = torch.device("cpu")


def predict_image(image_path: str, model_path: Path = DEFAULT_MODEL_PATH):
    image_path = Path(image_path)
    if not image_path.exists():
        raise FileNotFoundError(f"Image not found at {image_path}")

    # Fallback simulation if model checkpoint doesn't exist yet
    if not model_path.exists():
        dummy_classes = ["oily", "normal", "dry"]
        return {
            "predicted_class": "normal",
            "confidence": 0.85,
            "probabilities": {
                "oily": 0.10,
                "normal": 0.85,
                "dry": 0.05
            },
            "note": "Using mock prediction because skin_type_efficientnetb0.pt was not found."
        }

    # Real PyTorch Model Inference
    checkpoint = torch.load(model_path, map_location=DEVICE)
    class_names = checkpoint.get("class_names", ["oily", "normal", "dry"])

    model = build_model(num_classes=len(class_names))
    
    if "model_state_dict" in checkpoint:
        model.load_state_dict(checkpoint["model_state_dict"])
    else:
        model.load_state_dict(checkpoint)
        
    model.to(DEVICE)
    model.eval()

    tfm = transforms.Compose(
        [
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ]
    )

    img = Image.open(image_path).convert("RGB")
    x = tfm(img).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        logits = model(x)
        probs = F.softmax(logits, dim=1).squeeze(0)
        best_idx = int(torch.argmax(probs).item())
        best_prob = float(probs[best_idx].item())

    all_probs = {class_names[i]: float(probs[i].item()) for i in range(len(class_names))}
    result = {
        "predicted_class": class_names[best_idx],
        "confidence": best_prob,
        "probabilities": all_probs,
    }
    return result


def main():
    parser = argparse.ArgumentParser(description="Predict skin type from image.")
    parser.add_argument("--image", type=str, required=True, help="Path to input image")
    parser.add_argument("--model", type=str, default=str(DEFAULT_MODEL_PATH), help="Path to model checkpoint")
    args = parser.parse_args()

    result = predict_image(args.image, Path(args.model))
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()