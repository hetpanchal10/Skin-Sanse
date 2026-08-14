import argparse
import json
from pathlib import Path

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, random_split
from torchvision import models, transforms
from torchvision.datasets.folder import default_loader


IMG_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


class ClassFolderDataset(torch.utils.data.Dataset):
    def __init__(self, root: Path, class_names: list[str], transform):
        self.root = root
        self.class_names = class_names
        self.class_to_idx = {c: i for i, c in enumerate(class_names)}
        self.transform = transform
        self.samples: list[tuple[Path, int]] = []

        for c in class_names:
            class_dir = root / c
            if not class_dir.is_dir():
                continue
            for p in class_dir.rglob("*"):
                if p.is_file() and p.suffix.lower() in IMG_EXTS:
                    self.samples.append((p, self.class_to_idx[c]))

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx: int):
        path, label = self.samples[idx]
        img = default_loader(str(path))
        if self.transform is not None:
            img = self.transform(img)
        return img, label


def build_model(num_classes: int) -> nn.Module:
    print("Loading EfficientNet-B0 pretrained weights...", flush=True)
    weights = models.EfficientNet_B0_Weights.DEFAULT
    model = models.efficientnet_b0(weights=weights)
    print("Loaded pretrained weights.", flush=True)
    for p in model.parameters():
        p.requires_grad = False
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_features, num_classes)
    return model


def make_datasets(data_dir: Path, batch_size: int, seed: int):
    torch.manual_seed(seed)
    print(f"Loading dataset from: {data_dir}", flush=True)

    train_transform = transforms.Compose(
        [
            transforms.Resize((224, 224)),
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.RandomRotation(10),
            transforms.ColorJitter(contrast=0.15, saturation=0.05),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ]
    )
    val_transform = transforms.Compose(
        [
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ]
    )

    class_names = ["oily", "normal", "dry"]
    full = ClassFolderDataset(data_dir, class_names=class_names, transform=train_transform)
    print(f"Found {len(full)} images across {len(class_names)} classes.", flush=True)

    val_size = max(1, int(0.2 * len(full)))
    train_size = len(full) - val_size
    train_ds, val_ds = random_split(
        full,
        [train_size, val_size],
        generator=torch.Generator().manual_seed(seed),
    )
    val_ds.dataset = ClassFolderDataset(data_dir, class_names=class_names, transform=val_transform)

    train_loader = DataLoader(
        train_ds, batch_size=batch_size, shuffle=True, num_workers=0
    )
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=0)
    return train_loader, val_loader, class_names


@torch.no_grad()
def evaluate(model: nn.Module, loader: DataLoader, device: torch.device) -> float:
    model.eval()
    correct = 0
    total = 0
    for x, y in loader:
        x = x.to(device)
        y = y.to(device)
        logits = model(x)
        preds = torch.argmax(logits, dim=1)
        correct += (preds == y).sum().item()
        total += y.numel()
    return correct / max(1, total)


def train_epochs(
    model: nn.Module,
    train_loader: DataLoader,
    val_loader: DataLoader,
    device: torch.device,
    epochs: int,
    lr: float,
) -> float:
    if epochs <= 0:
        return evaluate(model, val_loader, device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=lr)
    best_val = 0.0
    best_state = None

    for epoch in range(1, epochs + 1):
        model.train()
        running_loss = 0.0
        for x, y in train_loader:
            x = x.to(device)
            y = y.to(device)
            optimizer.zero_grad(set_to_none=True)
            logits = model(x)
            loss = criterion(logits, y)
            loss.backward()
            optimizer.step()
            running_loss += loss.item() * y.size(0)

        val_acc = evaluate(model, val_loader, device)
        train_loss = running_loss / max(1, len(train_loader.dataset))
        if val_acc >= best_val:
            best_val = val_acc
            best_state = {k: v.detach().cpu().clone() for k, v in model.state_dict().items()}
        print(f"Epoch {epoch}/{epochs} - loss: {train_loss:.4f} - val_acc: {val_acc:.4f}")

    if best_state is not None:
        model.load_state_dict(best_state)
    return best_val


def main():
    parser = argparse.ArgumentParser(description="Train skin type classifier model.")
    parser.add_argument(
        "--data-dir",
        type=str,
        default=r"c:\Users\DELL\Desktop\data",
        help="Folder containing class subfolders (oily/normal/dry).",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=r"c:\Users\DELL\Desktop\data\skincare-master\ml\skin_type_efficientnetb0.pt",
        help="Output model file path.",
    )
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--epochs-head", type=int, default=15)
    parser.add_argument("--epochs-finetune", type=int, default=2)
    args = parser.parse_args()

    data_dir = Path(args.data_dir)
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}", flush=True)
    print("Preparing datasets...", flush=True)
    train_loader, val_loader, class_names = make_datasets(
        data_dir, args.batch_size, args.seed
    )
    print(f"Classes: {class_names}")

    print("Building model...", flush=True)
    model = build_model(num_classes=len(class_names)).to(device)
    print("Starting training (head)...", flush=True)
    best_val_1 = train_epochs(
        model, train_loader, val_loader, device, epochs=args.epochs_head, lr=3e-4
    )

    best_val_2 = 0.0
    if args.epochs_finetune > 0:
        print("Starting fine-tuning (last blocks)...", flush=True)
        for name, param in model.named_parameters():
            if name.startswith("features.6") or name.startswith("features.7") or name.startswith("classifier."):
                param.requires_grad = True

        best_val_2 = train_epochs(
            model,
            train_loader,
            val_loader,
            device,
            epochs=args.epochs_finetune,
            lr=3e-5,
        )
    best_val = max(best_val_1, best_val_2)
    print(f"Best validation accuracy: {best_val * 100:.2f}%")

    torch.save(
        {"model_state_dict": model.state_dict(), "class_names": class_names},
        output_path,
    )
    (output_path.parent / "class_names.json").write_text(
        json.dumps(class_names, indent=2), encoding="utf-8"
    )
    print(f"Saved model to: {output_path}")


if __name__ == "__main__":
    main()
