# Use a light version of Node
FROM node:18-slim

# Install system fonts and font-management utilities
# fonts-liberation provides standard serif/sans-serif fonts
RUN apt-get update && apt-get install -y \
  fonts-liberation \
  fontconfig \
  && rm -rf /var/lib/apt/lists/* \
  && fc-cache -f -v

# Create app directory
WORKDIR /usr/src/app

# Install dependencies first (for caching)
COPY package*.json ./
RUN npm install --production

# Copy the rest of the code
COPY . .

# Expose the port (though consumers usually just listen to RabbitMQ)
EXPOSE 8000

# Start the server
CMD [ "node", "index.js" ]