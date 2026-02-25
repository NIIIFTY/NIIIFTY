import { Storage } from "@google-cloud/storage";
import { PROJECT_ID } from "./constants.js";
import { getAllFiles } from "./fs.js";
import path from "path";
import fs from "fs";

const gcs = new Storage();

export const gcsBucket = gcs.bucket(`${PROJECT_ID}.appspot.com`);

export async function uploadFilesToGCS(dirPath, gcsPath) {
  const files = getAllFiles(dirPath);

  await Promise.all(
    files.map(async (file) => {
      const targetStorageFilePath = path.join(
        gcsPath,
        file.replace(`${dirPath}/`, "")
      );

      const fileStream = fs.createReadStream(file);

      const writeStream = gcsBucket
        .file(targetStorageFilePath)
        .createWriteStream({
          resumable: true,
        });

      return new Promise((resolve, reject) => {
        fileStream.pipe(writeStream).on("error", reject).on("finish", resolve);
      });
    })
  );
}

export async function deleteGCSFiles(files) {
  const deletions = files.map((file) => {
    // console.log(`Deleting ${file.name}`);
    return file.delete();
  });

  return await Promise.all(deletions);
}
