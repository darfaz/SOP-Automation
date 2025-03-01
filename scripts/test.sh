#!/bin/bash

# Run unit tests
echo "Running unit tests..."
pytest backend/tests/

# Run integration tests
echo "Running integration tests..."
pytest backend/tests/integration/

# Run Docker build test
echo "Testing Docker build..."
docker build -t sop-automation-test .

# Test the container
echo "Testing container..."
docker run --rm \
  -e OPENAI_API_KEY=${OPENAI_API_KEY} \
  -e ENVIRONMENT=testing \
  sop-automation-test python -m pytest

# Clean up
docker rmi sop-automation-test 