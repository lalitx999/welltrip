# Production Dockerfile for Django DRF Backend
FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements/production.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt || pip install --no-cache-dir gunicorn psycopg2-binary django djangorestframework djangorestframework-simplejwt django-cors-headers django-environ celerey redis openpyxl pandas

# Copy application code
COPY . /app/

# Expose Gunicorn port
EXPOSE 8000

# Default entrypoint command
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "core.wsgi:application"]
