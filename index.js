const { spawn } = require("node:child_process");
const fs = require("node:fs/promises");
const path = require("node:path");
const { rimraf } = require("rimraf");
const tmp = require("tmp-promise");

export const IMAGE_TAG = "v6.6.0";

export const DEFAULT_CONFIG = {
  npmName: "temp",
  npmVersion: "1.0.0",
  snapshot: false,
  supportsES6: true,
  withInterfaces: false,
  withoutPrefixEnums: false,
  allowUnicodeIdentifiers: true,
  legacyDiscriminatorBehavior: false,
  nullSafeAdditionalProps: true,
  withSeparateModelsAndApi: false,
  useSingleRequestParameter: false,
  disallowAdditionalPropertiesIfNotPresent: true,
  stringEnums: false,
  typescriptThreePlus: true
};

exports.generate = async function (openapiPath, outputDir, imageTag = IMAGE_TAG, config = DEFAULT_CONFIG) {
  if (!openapiPath) {
    throw new Error("No openapiPath provided");
  }
  if (!outputDir) {
    throw new Error("No outputDir provided");
  }
  openapiPath = path.resolve(openapiPath);
  outputDir = path.resolve(outputDir);
  console.log("Generating from", openapiPath, "to", outputDir);

  // generate output
  const tmpdir = await tmp.dir();
  const configDir = await tmp.dir();

  await fs.writeFile(path.join(configDir.path, "generate-config.json"), JSON.stringify(config), "utf8");

  await new Promise((res, rej) => {
    const proc = spawn(
      "docker",
      [
        "run",
        "--rm",
        "-v",
        `${configDir.path}:/openapi-gen-config`,
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
