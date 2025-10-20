
FROM node:lts

RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv python3-dev build-essential && \
    ln -s /usr/bin/python3 /usr/bin/python && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY requirements.txt ./

RUN python3 -m venv /opt/venv \
    && /opt/venv/bin/pip install --upgrade pip \
    && /opt/venv/bin/pip install -r requirements.txt

ENV PATH="/opt/venv/bin:$PATH"

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
