# Use a base image with Node.js and Python
FROM node:18-bullseye

# Install Python
RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    ln -s /usr/bin/python3 /usr/bin/python

# Create app directory
WORKDIR /app

# Copy package.json and install Node.js deps
COPY package*.json ./
RUN npm install

# Copy the rest of the code (including .py files and uploads folder)
COPY . .

# Install Python dependencies
RUN pip install -r requirements.txt

# Expose the backend port (update if your app uses another)
EXPOSE 5000

# Start your backend
CMD ["npm", "start"]
