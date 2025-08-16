# -----------------------------
# Base image: Node.js LTS
# -----------------------------
FROM node:lts

# -----------------------------
# Install Python and build tools
# -----------------------------
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv python3-dev build-essential && \
    ln -s /usr/bin/python3 /usr/bin/python && \
    rm -rf /var/lib/apt/lists/*

# -----------------------------
# Set working directory
# -----------------------------
WORKDIR /app

# -----------------------------
# Copy Node dependencies first (cache layer)
# -----------------------------
COPY package*.json ./
RUN npm install

# -----------------------------
# Copy Python requirements
# -----------------------------
COPY requirements.txt ./

# -----------------------------
# Create Python venv and install requirements
# -----------------------------
RUN python3 -m venv /opt/venv && \
    /opt/venv/bin/pip install --upgrade pip && \
    /opt/venv/bin/pip install -r requirements.txt

# -----------------------------
# Make venv available globally
# -----------------------------
ENV PATH="/opt/venv/bin:$PATH"

# -----------------------------
# Copy only backend code
# Exclude frontend and other unnecessary files
# -----------------------------
COPY . .

# -----------------------------
# Expose port (Render uses $PORT)
# -----------------------------
EXPOSE 5000

# -----------------------------
# Start backend
# -----------------------------
CMD ["npm", "start"]
