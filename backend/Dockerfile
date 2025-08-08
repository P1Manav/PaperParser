# Use a base image with Node.js and Python
FROM node:lts

# Install Python
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-dev build-essential && \
    ln -s /usr/bin/python3 /usr/bin/python

# Create app directory
WORKDIR /app

# Copy package.json and install Node.js deps
COPY package*.json ./
RUN npm install

COPY requirements.txt ./
RUN pip install -r requirements.txt
# Copy the rest of the code (including .py files and uploads folder)
COPY . .

# Install Python dependencies

# Expose the backend port (update if your app uses another)
EXPOSE 5000

# Start your backend
CMD ["npm", "start"]
