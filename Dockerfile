FROM node:14

ENV TINI_VERSION v0.19.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
RUN chmod +x /tini
ENTRYPOINT ["/tini", "--"]

RUN apt-get update && apt-get install -y openjdk-8-jre-headless

WORKDIR /app

COPY . .
RUN npm install
RUN npx openapi-generator-cli version-manager set 5.0.1

CMD ["node", "main.js"]
