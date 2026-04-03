import ffmpeg from "fluent-ffmpeg";
import ffmpeg_static from "ffmpeg-static";
import path from "path";
import ffprobe from "ffprobe";
import ffprobeStatic from "ffprobe-static";
import createThumbnails from "./thumbnails.js";
import { deleteFile, createDir } from "./fs.js";
import { createMP4IIIFDerivatives } from "./iiif.js";

export default async function processMP4(mp4FilePath, metadata) {
  // optimise mp4
  await optimizeMP4(mp4FilePath);

  await createThumbs(mp4FilePath);
  console.log("mp4 thumbnails generated");

  const duration = await getDuration(mp4FilePath);
  console.log("mp4 duration", duration);

  await createStreamingFormats(mp4FilePath);
  console.log("mp4 streaming formats generated");

  // set the duration on metadata (this will be updated in the db when processing completes)
  metadata.duration = duration;

  // generate IIIF manifest
  await createMP4IIIFDerivatives(mp4FilePath, metadata);

  // delete the original mp4 as it's already on GCS and will otherwise be uploaded again
  deleteFile(mp4FilePath);

  return { duration };
}

async function optimizeMP4(mp4FilePath) {
  const dir = path.dirname(mp4FilePath);

  // Define output file paths
  const optimizedFilePath = path.join(dir, "optimized.mp4");

  const command = ffmpeg(mp4FilePath)
    .setFfmpegPath(ffmpeg_static)
    .videoCodec("libx264")
    .audioCodec("aac")
    .audioBitrate("64k")
    .videoBitrate("550k")
    .addOption("-preset", "veryfast")
    .addOption("-profile:v", "main")
    .output(optimizedFilePath);

  await promisifyCommand(command);

  console.log("mp4 optimized at", optimizedFilePath);
}

function promisifyCommand(command) {
  return new Promise((resolve, reject) => {
    command.on("end", resolve).on("error", reject).run();
  });
}

async function createThumbs(mp4) {
  const frameFilePath = path.join(path.dirname(mp4), "frame.jpg");

  const command = ffmpeg(mp4)
    .setFfmpegPath(ffmpeg_static)
    .seekInput("00:00:01") // seek to 1 second into the video
    .frames(1) // extract only one frame
    // .outputOptions("-vf", "scale=320:-1") // resize the frame to a width of 320 pixels
    .output(frameFilePath);

  await promisifyCommand(command);

  console.log("frame created at", frameFilePath);

  await createThumbnails(frameFilePath);

  // delete the temp frame file.
  deleteFile(frameFilePath);
}

async function getDuration(mp4) {
  const info = await ffprobe(mp4, {
    path: ffprobeStatic.path,
  });

  if (info && info.streams && info.streams.length) {
    return Number(info.streams[0].duration);
  } else {
    throw new Error("couldn't retrieve video duration");
  }
}

async function createStreamingFormats(mp4) {
  const dir = path.dirname(mp4);

  // Define output file paths
  const dashDir = path.join(dir, "dash");
  createDir(dashDir);

  const hlsDir = path.join(dir, "hls");
  createDir(hlsDir);

  // Define output file paths
  const dashFilePath = path.join(dashDir, "optimized.mpd");
  const hlsFilePath = path.join(hlsDir, "optimized.m3u8");

  const dashCommand = ffmpeg(mp4)
    // .videoCodec("libx264")
    // .audioCodec("aac")
    // .audioBitrate("64k")
    // .videoBitrate("550k")
    // // .addOption("-max_muxing_queue_size", "1024")
    // .addOption("-preset", "veryfast")
    // .addOption("-profile:v", "main")
    .format("dash")
    .output(dashFilePath);

  await promisifyCommand(dashCommand);
  console.log("dash created at", dashFilePath);

  const hlsCommand = ffmpeg(mp4)
    .addOption("-start_number", "0")
    .addOption("-hls_time", "10")
    .addOption("-hls_list_size", "0")
    .format("hls")
    .output(hlsFilePath);

  await promisifyCommand(hlsCommand);
  console.log("hls created at", hlsFilePath);
}
