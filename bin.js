#!/usr/bin/env node

const { generate, DEFAULT_CONFIG, IMAGE_TAG } = require("./index");

const openapiPath = process.argv[2];
const outputDir = process.argv[3] ?? "./generated";
const withSeparateModelsAndApi = process.argv[4] === "--with-separate-models-and-api";

const config = { ...DEFAULT_CONFIG };
if (withSeparateModelsAndApi) {
  config.withSeparateModelsAndApi = true;
}

generate(openapiPath, outputDir, IMAGE_TAG, config).catch((err) => {
  console.error(err.message);
});
