FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

ENV VITE_PORT=3000
ENV HOST=0.0.0.0

CMD ["npm", "run", "dev", "--", "--port", "3000", "--host"] 