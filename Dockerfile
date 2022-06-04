FROM node:lts-slim

ENV TINI_VERSION v0.19.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
RUN chmod +x /tini
ENTRYPOINT ["/tini", "--"]

RUN apt-get update && apt-get install -y openjdk-11-jre-headless

WORKDIR /app

COPY . .
RUN npm install

CMD ["node", "main.js"]
