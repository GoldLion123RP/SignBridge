# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PIP_NO_CACHE_DIR 1
ENV PIP_DISABLE_PIP_VERSION_CHECK 1

# Install system dependencies for OpenCV and MediaPipe
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user for security
RUN useradd -m signbridge
WORKDIR /home/signbridge/app

# Copy and install requirements as root (to system path)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Switch to the non-root user
COPY --chown=signbridge:signbridge . .
USER signbridge

# Expose the port the app runs on
EXPOSE 10000

# Command to run the application
CMD ["python", "main.py", "--host", "0.0.0.0", "--port", "10000"]
