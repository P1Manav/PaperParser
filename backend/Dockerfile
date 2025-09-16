# Base: Node.js LTS
FROM node:lts

# Install Python + build deps
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv python3-dev build-essential && \
    ln -s /usr/bin/python3 /usr/bin/python && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Node dependencies first
COPY package*.json ./
RUN npm install

# Copy Python dependencies
COPY requirements.txt ./

# Setup Python venv
RUN python3 -m venv /opt/venv \
    && /opt/venv/bin/pip install --upgrade pip \
    && /opt/venv/bin/pip install -r requirements.txt

# Add venv to PATH for Python
ENV PATH="/opt/venv/bin:$PATH"

# Copy rest of the app
COPY . .

# Expose (Render/Heroku style $PORT)
EXPOSE 5000

# Start Node server
CMD ["npm", "start"]
