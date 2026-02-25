import fs from "fs";
import { NodeIO } from "@gltf-transform/core";
import { KHRONOS_EXTENSIONS } from "@gltf-transform/extensions";
import {
  dedup,
  flatten,
  join,
  weld,
  resample,
  prune,
  sparse,
  // textureCompress,
  draco,
} from "@gltf-transform/functions";
import draco3d from "draco3dgltf";
import path from "path";
import puppeteer from "puppeteer";
import createThumbnails from "./thumbnails.js";
import { REGULAR_WIDTH } from "./constants.js";
import { createGLBIIIFDerivatives } from "./iiif.js";
import { deleteFile } from "./fs.js";
import express from "express";
import cors from "cors";
import net from "net";

export default async function processGLB(glbFilePath, metadata) {
  // optimise glb using gltf-transform
  const optimizedGLBFilePath = await optimizeGLB(glbFilePath);

  const screenshotPath = await screenshotGLB(optimizedGLBFilePath);

  await createThumbnails(screenshotPath);

  // delete screenshot
  deleteFile(screenshotPath);

  // generate IIIF manifest
  await createGLBIIIFDerivatives(glbFilePath, metadata);

  // delete the original glb as it's already on GCS and will otherwise be uploaded again
  deleteFile(glbFilePath);

  return {};
}

async function optimizeGLB(glbFilePath) {
  console.log("optimizing glb", glbFilePath);

  const io = new NodeIO()
    .registerExtensions(KHRONOS_EXTENSIONS)
    .registerDependencies({
      "draco3d.decoder": await draco3d.createDecoderModule(), // Optional.
      "draco3d.encoder": await draco3d.createEncoderModule(), // Optional.
    });
  // .setAllowHTTP(true);

  const document = await io.read(glbFilePath);

  await document.transform(
    dedup(),
    // instance({ min: 5 }),
    flatten(),
    join(),
    weld({ tolerance: 0.0001 }),
    // simplify({ simplifier: MeshoptSimplifier, ratio: 0.001, error: 0.0001 }),
    resample(),
    prune({ keepAttributes: false, keepLeaves: false }),
    sparse(),
    // this errors if the model doesn't have any textures
    // textureCompress({
    //   encoder: sharp,
    //   targetFormat: "auto",
    //   resize: [2048, 2048],
    // }),
    draco()
  );

  const optimizedGLB = await io.writeBinary(document);

  const optimizedGLBFilePath = path.join(
    path.dirname(glbFilePath),
    "optimized.glb"
  );

  // write the optimized glb to the temp dir
  fs.writeFileSync(optimizedGLBFilePath, optimizedGLB);

  return optimizedGLBFilePath;
}

function toHTMLAttributeString(args) {
  if (!args) return "";

  return Object.entries(args)
    .map(([key, value]) => {
      return `${key}="${value}"`;
    })
    .join("\n");
}

function modelViewerHTMLTemplate(
  modelViewerUrl,
  width,
  height,
  src,
  backgroundColor,
  devicePixelRatio
) {
  const defaultAttributes = {
    id: "snapshot-viewer",
    style: `background-color: ${backgroundColor};`,
    "interaction-prompt": "none",
    src: src,
  };

  const defaultAttributesString = toHTMLAttributeString(defaultAttributes);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=${devicePixelRatio}">
        <script type="module"
          src="${modelViewerUrl}">
        </script>
        <style>
          body {
            margin: 0;
          }
          model-viewer {
            --progress-bar-color: transparent;
            width: ${width}px;
            height: ${height}px;
          }
        </style>
      </head>
      <body>
        <model-viewer
          ${defaultAttributesString}
        />
      </body>
    </html>
  `;
}

function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.unref(); // Allows the program to exit if this is the only active server

    server.on("error", (err) => {
      reject(err);
    });

    server.on("listening", () => {
      const port = server.address().port;
      server.close(() => {
        resolve(port);
      });
    });

    server.listen(0, "localhost");
  });
}

function serveGLB(glbFilePath) {
  return new Promise(async (resolve, reject) => {
    console.log(`serveGLB: ${glbFilePath}`);

    const dir = path.dirname(glbFilePath);
    const file = path.basename(glbFilePath);

    const app = express();
    const port = await getAvailablePort();

    app.use(cors());
    app.use(express.static(dir));

    const src = `http://localhost:${port}/${file}`;

    process.on("SIGTERM", shutDown);
    process.on("SIGINT", shutDown);

    let connections = [];

    app.get("/", (req, res) => res.json({ ping: true }));

    const server = app.listen(port, () => {
      console.log(`Server listening on port: ${port}`);
      resolve({
        src,
        server,
      });
    });

    server.on("connection", (connection) => {
      connections.push(connection);
      connection.on(
        "close",
        () => (connections = connections.filter((curr) => curr !== connection))
      );
    });

    // setInterval(
    //   () =>
    //     server.getConnections((err, connections) =>
    //       console.log(`${connections} connections currently open`)
    //     ),
    //   1000
    // );

    function shutDown() {
      console.log("Received kill signal, shutting down gracefully");
      server.close(() => {
        console.log("Closed out remaining connections");
        process.exit(0);
      });

      setTimeout(() => {
        console.error(
          "Could not close connections in time, forcefully shutting down"
        );
        process.exit(1);
      }, 10000);

      connections.forEach((curr) => curr.end());
      setTimeout(() => connections.forEach((curr) => curr.destroy()), 5000);
    }
  });
}

async function screenshotGLB(glbFilePath) {
  console.log(`screenshotGLB: ${glbFilePath}`);

  const { src } = await serveGLB(glbFilePath);

  console.log(`glb src: ${src}`);

  const args = [
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--disable-setuid-sandbox",
    "--no-zygote",
    "--single-process",
  ];

  const headless = true;
  const width = REGULAR_WIDTH;
  const height = REGULAR_WIDTH;
  const devicePixelRatio = 1;
  const modelViewerUrl =
    "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";
  const backgroundColor = "#000000";

  const browser = await puppeteer.launch({
    args,
    defaultViewport: {
      width,
      height,
      deviceScaleFactor: devicePixelRatio,
    },
    headless,
  });

  const page = await browser.newPage();

  await page.setDefaultNavigationTimeout(0);

  const data = modelViewerHTMLTemplate(
    modelViewerUrl,
    width,
    height,
    src,
    backgroundColor,
    devicePixelRatio
  );

  // console.log("modelviewer template", data);

  await page.setContent(data, {
    waitUntil: ["domcontentloaded", "networkidle0"],
  });

  const element = await page.$("model-viewer");
  const boundingBox = await element.boundingBox();

  await page.setViewport({
    width: Math.ceil(boundingBox.width),
    height: Math.ceil(boundingBox.height),
    deviceScaleFactor: devicePixelRatio,
  });

  const screenshot = await element.screenshot(); // returns a buffer

  const screenshotPath = path.join(path.dirname(glbFilePath), "screenshot.png");

  fs.writeFileSync(screenshotPath, screenshot);

  await browser.close();

  return screenshotPath;
}
