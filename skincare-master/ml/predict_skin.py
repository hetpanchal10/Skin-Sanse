import argparse
import json
from pathlib import Path

import torch
from PIL import Image
from torchvision import models, transforms


def build_model(num_classes: int) -> torch.nn.Module:
    model = models.efficientnet_b0(weights=None)
    in_features = model.classifier[1].in_features
    model.classifier[1] = torch.nn.Linear(in_features, num_classes)
    return model


DEFAULT_MODEL_PATH = Path(__file__).parent / "model.pth"
DEVICE = torch.device("cpu")


def predict_image(image_path: str, model_path: Path = DEFAULT_MODEL_PATH):
    image_path = Path(image_path)
    if not image_path.exists():
        raise FileNotFoundError(f"Image not found at {image_path}")

    # Fallback simulation if model checkpoint doesn't exist yet, 
    # allowing you to test your UI/API pipeline immediately with varying responses.
    if not model_path.exists():
        img = Image.open(image_path).convert("RGB")
        width, height = img.size
        dummy_classes = ["Oily", "Dry", "Normal", "Combination"]
        selected_class = dummy_classes[(width + height) % len(dummy_classes)]
        return {
            "predicted_class": selected_class,
            "confidence": 0.92,
            "probabilities": {
                "Oily": 0.05,
                "Dry": 0.03,
                "Normal": 0.02,
                "Combination": 0.92
            },
            "note": "Using mock prediction because model.pth was not found in ml folder."
        }

    # Real PyTorch Model Inference
    checkpoint = torch.load(model_path, map_location=DEVICE)
    class_names = checkpoint.get("class_names", ["Oily", "Dry", "Normal", "Combination"])

    model = build_model(num_classes=len(class_names))
    model.load_state_dict(checkpoint["model_state_dict"])
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
        probs = torch.softmax(logits, dim=1).squeeze(0)
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