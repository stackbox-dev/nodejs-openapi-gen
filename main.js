const { spawn } = require("child_process");
const express = require("express");
const multer = require("multer");
const tmp = require("tmp");
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const { pipeline } = require("stream");

const app = express();
const upload = multer({
  storage: multer.diskStorage({
    filename: function (_req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix);
    }
  })
});

app.post("/generate", upload.single("openapispec"), function (req, res) {
  generate(req.file.path, function (err, output) {
    if (err) {
      res.send(err);
    } else {
      console.log(output);
      const oname = req.file.originalname;
      const fname = oname.slice(0, oname.length - path.extname(oname).length).replace(/"/g, "");
      res
        .status(200)
        .contentType("application/zip")
        .header("Content-Disposition", `attachment; filename="${fname}.zip"`);
      const zip = archiver("zip");
      pipeline(zip, res, function (err) {
        if (err) {
          console.error(err);
        }
        fs.rmdir(output, { recursive: true, force: true }, function (err) {
          if (err) {
            console.error(err);
          }
        });
      });
      zip.glob("*.ts", { cwd: output });
      zip.finalize();
    }
  });
});

app.get("/", function (_req, res) {
  res.sendFile("index.html", { root: __dirname });
});

app.get("/*", function (_req, res) {
  res.redirect("/");
});

const port = Number.parseInt(process.env.PORT ?? "3000");
app.listen(port, function () {
  console.log("Server started on port " + port);
});

function generate(openapiFilename, cb) {
  prepareConfigAndOutput(function (err, config, output) {
    if (err) {
      cb(err);
      return;
    }
    const p = spawn(
      "node_modules/.bin/openapi-generator-cli",
      [
        "generate",
        "-g",
        "typescript-axios",
        "-c",
        config,
        "-o",
        output,
        "--enable-post-process-file",
        "--skip-validate-spec",
        "-i",
        openapiFilename
      ],
      {
        cwd: __dirname,
        shell: false,
        stdio: "inherit"
      }
    );

    p.on("error", (err) => {
      if (err) {
        cb(err);
      }
    });

    p.on("exit", (code) => {
      if (code === 0) {
        cb(null, output);
      } else {
        cb(new Error("Failed " + code));
      }
    });
  });
}

function prepareConfigAndOutput(cb) {
  const config = {
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
    useSingleRequestParameter: true,
    disallowAdditionalPropertiesIfNotPresent: true
  };
  tmp.dir(function (err, dirname) {
    if (err) {
      cb(err);
      return;
    }
    const filename = path.join(dirname, "config.json");
    fs.writeFile(filename, JSON.stringify(config), { encoding: "utf-8" }, function (err) {
      if (err) {
        cb(err);
        return;
      }
      cb(null, filename, dirname);
    });
  });
}
