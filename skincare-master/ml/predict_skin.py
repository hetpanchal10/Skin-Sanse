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


def main():
    parser = argparse.ArgumentParser(description="Predict skin type from image.")
    parser.add_argument("--image", type=str, required=True, help="Path to input image")
    parser.add_argument("--model", type=str, required=True, help="Path to model checkpoint")
    args = parser.parse_args()

    image_path = Path(args.image)
    model_path = Path(args.model)

    checkpoint = torch.load(model_path, map_location="cpu")
    class_names = checkpoint["class_names"]

    model = build_model(num_classes=len(class_names))
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    tfm = transforms.Compose(
        [
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ]
    )

    img = Image.open(image_path).convert("RGB")
    x = tfm(img).unsqueeze(0)

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
    print(json.dumps(result))


if __name__ == "__main__":
    main()
