const { spawn } = require("node:child_process");
const fs = require("node:fs/promises");
const path = require("node:path");
const { rimraf } = require("rimraf");
const tmp = require("tmp-promise");

const IMAGE_TAG = "v6.6.0";

exports.generate = async function (openapiPath, outputDir, imageTag = IMAGE_TAG) {
  if (!openapiPath) {
    throw new Error("No openapiPath provided");
  }
  if (!outputDir) {
    throw new Error("No outputDir provided");
  }
  console.log("Generating from", openapiPath, "to", outputDir);

  // generate output
  const tmpdir = await tmp.dir();

  await new Promise((res, rej) => {
    const proc = spawn(
      "docker",
      [
        "run",
        "--rm",
        "-v",
        `${__dirname}:/openapi-gen-config`,
        "-v",
        `${path.dirname(openapiPath)}:/input`,
        "-v",
        `${tmpdir.path}:/output`,
        `openapitools/openapi-generator-cli:${imageTag}`,
        "generate",
        "-g",
        "typescript-axios",
        "-c",
        "/openapi-gen-config/generate-config.json",
        "-i",
        `/input/${path.basename(openapiPath)}`,
        "-o",
        "/output",
        "--skip-validate-spec",
        "--type-mappings",
        "object=any"
      ],
      {
        cwd: __dirname,
        stdio: "inherit"
      }
    );

    proc.on("error", (err) => {
      if (err) rej(err);
    });

    proc.on("exit", (code) => {
      if (code === 0) {
        res(outputDir);
      } else {
        rej(new Error("Failed with exit-code=" + code));
      }
    });
  });

  // copy to output dir
  await rimraf(outputDir);
  await fs.mkdir(outputDir);
  for (const file of await fs.readdir(tmpdir.path)) {
    if (path.extname(file) === ".ts") {
      await fs.cp(path.join(tmpdir.path, file), path.join(outputDir, file));
    }
  }
};
