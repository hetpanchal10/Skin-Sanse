# Skin Type AI Model

This folder contains a training script for a 3-class skin type model:
- `dry`
- `normal`
- `oily`

## Setup

```bash
cd skincare-master/ml
python -m pip install -r requirements.txt
```

## Train

```bash
python train_skin_model.py --data-dir "c:\Users\DELL\Desktop\data"
```

The script saves the model to:

`c:\Users\DELL\Desktop\data\skincare-master\ml\skin_type_efficientnetb0.pt`
