#!/usr/bin/env node

const { generate } = require("./index");

const openapiPath = process.argv[2];
const outputDir = process.argv[3] ?? "./generated";

generate(openapiPath, outputDir).catch((err) => {
  console.error(err.message);
});
