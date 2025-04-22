FROM node:23-alpine

# Install pnpm globally
RUN npm install -g pnpm

# Create and set working directory
WORKDIR /usr/src/app

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml* ./

# Install dependencies using pnpm
RUN pnpm install

# Copy remaining application code
COPY . .

# Command to run the application
CMD ["pnpm", "start"]