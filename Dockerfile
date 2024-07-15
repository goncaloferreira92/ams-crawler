FROM node:18-alpine
COPY . .
RUN apk add --update curl
CMD ["curl", "-fsSL https://bun.sh/install"]
RUN npm install --global pnpm
RUN pnpm install
EXPOSE 3000