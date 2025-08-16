# Use Node.js LTS base
FROM node:lts

# Install Python 3 and build tools
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv python3-dev build-essential && \
    ln -s /usr/bin/python3 /usr/bin/python && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy Node.js dependencies first (for caching)
COPY package*.json ./
RUN npm install

# Copy Python requirements
COPY requirements.txt ./

# Create a virtual environment and install Python packages there
RUN python3 -m venv /opt/venv && \
    /opt/venv/bin/pip install --upgrade pip && \
    /opt/venv/bin/pip install -r requirements.txt

# Make the venv available globally for all commands
ENV PATH="/opt/venv/bin:$PATH"

# Copy the rest of the code (Node + Python + static)
COPY . .

# Ensure directories exist (so frontend module doesn't crash)
RUN mkdir -p static templates outputs images

# Expose port (Render uses $PORT)
EXPOSE 5000

# Start the backend
CMD ["npm", "start"]
