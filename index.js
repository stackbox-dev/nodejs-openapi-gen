const { spawn } = require("node:child_process");
const fs = require("node:fs/promises");
const path = require("node:path");
const { rimraf } = require("rimraf");
const tmp = require("tmp-promise");

const IMAGE_TAG = "v6.6.0";

exports.generate = async function (openapiPath, output, imageTag = IMAGE_TAG) {
  console.log("Generating from", openapiPath, "to", output);

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
        res(output);
      } else {
        rej(new Error("Failed with exit-code=" + code));
      }
    });
  });

  // copy to output dir
  await rimraf(output);
  await fs.mkdir(output);
  for (const file of await fs.readdir(tmpdir.path)) {
    if (path.extname(file) === ".ts") {
      await fs.cp(path.join(tmpdir.path, file), path.join(output, file));
    }
  }
};
