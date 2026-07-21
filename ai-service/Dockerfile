FROM python:3.10-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    tini \
    && rm -rf /var/lib/apt/lists/*

RUN addgroup --system --gid 1001 app && \
    adduser --system --uid 1001 app

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    rm -rf ~/.cache/pip

COPY --chown=app:app main.py ./

EXPOSE 8000

USER app

# Use tini for proper signal handling; $PORT is injected by Railway
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
