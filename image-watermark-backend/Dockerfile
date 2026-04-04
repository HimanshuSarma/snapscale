# Use the full Debian-based Node image (contains more pre-installed libs)
FROM node:18

# Install a full suite of graphic libraries and fonts
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    fontconfig \
    fonts-dejavu \
    fonts-liberation \
    fonts-noto \
    && rm -rf /var/lib/apt/lists/*

# Force the system to recognize the new fonts
RUN fc-cache -f -v

WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
# Remove --production temporarily to ensure build tools can compile native modules
RUN npm install

# Copy the rest of the code
COPY . .

EXPOSE 8000

CMD [ "node", "index.js" ]