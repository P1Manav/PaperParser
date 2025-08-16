# Base Node.js image
FROM node:lts

# Install Python and build tools for packages like PyMuPDF
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv python3-dev build-essential libmupdf-dev && \
    ln -s /usr/bin/python3 /usr/bin/python && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy Node dependencies first (for caching)
COPY package*.json ./
RUN npm install

# Copy Python requirements and create virtual environment
COPY requirements.txt ./
RUN python3 -m venv /opt/venv && \
    /opt/venv/bin/pip install --upgrade pip setuptools wheel && \
    /opt/venv/bin/pip install -r requirements.txt

# Make venv global
ENV PATH="/opt/venv/bin:$PATH"

# Copy all backend code (Node + Python scripts)
COPY . .

# Ensure required directories exist
RUN mkdir -p static templates outputs uploads

# Expose port
EXPOSE 5000

# Start Node.js app
CMD ["npm", "start"]
