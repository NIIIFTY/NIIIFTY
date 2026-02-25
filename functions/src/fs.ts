import os from "os";
import fs from "fs";
import path from "path";

// Recursively get a list of all files in the directory
export const getAllFiles = function (dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function (file) {
    if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
      arrayOfFiles = getAllFiles(path.join(dirPath, file), arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, file));
    }
  });

  return arrayOfFiles;
};

export function createTempDir() {
  const uniqueId = String(Date.now());

  // Create a temp directory where the storage file will be downloaded.
  const dir = path.join(os.tmpdir(), uniqueId);

  fs.mkdirSync(dir);

  return dir;
}

export function createDir(path) {
  fs.mkdirSync(path);
}

export function deleteFile(file) {
  fs.unlinkSync(file);
}

export function deleteDir(dir) {
  fs.rmSync(dir, { recursive: true });
}
