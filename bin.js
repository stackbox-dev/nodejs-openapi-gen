const { generate } = require("./index");

const openapiPath = process.argv[2];
const output = process.argv[3] ?? "./generated";

generate(openapiPath, output);
