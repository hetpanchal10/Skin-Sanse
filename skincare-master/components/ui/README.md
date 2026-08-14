## Django scaffold (inside `components/ui`)

This folder originally contained React/TSX UI components. A minimal Django project has been added alongside them so you can start migrating UI into Django templates/static.

### Run

From this folder:

```bash
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Open `http://127.0.0.1:8000/`.

