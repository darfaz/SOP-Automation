# Use Python 3.11
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY backend/requirements.txt ./requirements.txt

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Create backend directory and copy files
RUN mkdir -p /app/backend
COPY backend/ /app/backend/

# Expose port
EXPOSE 8000

# Command to run the application
CMD uvicorn backend.main:app --host 0.0.0.0 --port 8000