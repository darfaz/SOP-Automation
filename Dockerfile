# Use Python 3.11
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY backend/requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend folder to app folder
COPY backend/ .

# Expose port
EXPOSE 8000

# Command to run the application - modify to use the correct module path
# Simple approach - remove variable substitution and let Railway handle it
CMD uvicorn main:app --host 0.0.0.0 --port 8000