uvicorn app.main:app --reload --port 8000

source .venv/Scripts/activate

pip install -r requirements.txt

python -m scripts.create_owner

alembic upgrade head

pnpm run dev