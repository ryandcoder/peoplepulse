# Build context is the repository root (so the dataset in ./data can be bundled into the image):
#   docker build -f backend/Dockerfile .
FROM python:3.12-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/app ./app
# Bundled dataset (used when no volume is mounted, e.g. on Render). docker-compose mounts ./data over /data instead.
COPY data ./data
ENV DATA_PATH=/app/data/employee_attrition.csv
EXPOSE 8000
# Hosting platforms such as Render inject $PORT; locally it falls back to 8000.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
