# Use a light version of Node
FROM node:18-slim

# Create app directory
WORKDIR /usr/src/app

# Install dependencies first (for caching)
COPY package*.json ./
RUN npm install --production

# Copy the rest of the code
COPY . .

# Expose the port Server 1 listens on
EXPOSE 8000

# Start the server
CMD [ "node", "index.js" ]