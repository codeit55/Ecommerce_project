# Base image with lightweight Python 3.12
FROM python:3.12-slim

# Prevent Python from writing .pyc and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set working directory inside container
WORKDIR /app

# Install system dependencies needed for compilation and PostgreSQL
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application files
COPY . /app/

# Expose port 8000 for Django REST API
EXPOSE 8000

# Default command to run migrations and start Django server
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
