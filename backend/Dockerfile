# Use Node.js LTS base
FROM node:lts

# Install Python 3, pip, and build tools
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv python3-dev build-essential && \
    ln -s /usr/bin/python3 /usr/bin/python && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy Node.js dependencies first (cache layer)
COPY package*.json ./
RUN npm install

# Copy Python requirements
COPY requirements.txt ./

# Create Python virtual environment and install packages
RUN python -m venv /opt/venv && \
    /opt/venv/bin/pip install --upgrade pip && \
    /opt/venv/bin/pip install -r requirements.txt

# Make the Python venv available globally
ENV PATH="/opt/venv/bin:$PATH"

# Copy the rest of the app (Node + Python code + static files)
COPY . .

# Ensure the 'static' directory exists (needed for frontend module)
RUN mkdir -p static templates outputs images

# Expose the port (Render uses $PORT)
EXPOSE 5000

# Start the backend
CMD ["npm", "start"]
