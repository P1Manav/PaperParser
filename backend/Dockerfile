FROM node:lts-alpine

# Install Python, pip, and system dependencies
RUN apk add --no-cache python3 py3-pip ffmpeg

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# Copy Python requirements and install
COPY requirements.txt ./
RUN pip3 install -r requirements.txt

# Create necessary directories
RUN mkdir -p uploads outputs images

# Copy application code
COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
