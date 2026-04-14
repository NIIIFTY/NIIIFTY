import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export async function uploadTempFilesToFilebase(tempDirPath: string): Promise<string> {
  const s3Client = new S3Client({
    endpoint: 'https://s3.filebase.com',
    region: 'us-east-1',
    credentials: {
      accessKeyId: process.env.FILEBASE_ACCESS_TOKEN || 'placeholder',
      secretAccessKey: process.env.FILEBASE_SECRET_KEY || 'placeholder',
    },
  });

  const carFileName = `${path.basename(tempDirPath)}.car`;
  // Place the car buffer directly adjacent to the temp directory
  const outCarPath = path.join(path.dirname(tempDirPath), carFileName);

  try {
    // Pack the directory into a CAR file using ipfs-car CLI
    // This utilizes the stream encoder but guarantees the root CID is injected into the CAR header.
    console.log(`Packing ${tempDirPath} to ${outCarPath}`);
    const { stdout } = await execAsync(`npx ipfs-car pack "${tempDirPath}" --output "${outCarPath}"`);
    const cidFromPack = stdout.trim();

    // Read the packed CAR file from disk into memory buffer limits
    const carBuffer = fs.readFileSync(outCarPath);

    // Upload to Filebase S3 API
    console.log(`Uploading ${carFileName} to Filebase S3...`);
    const command = new PutObjectCommand({
      Bucket: 'niiifty', // The standard global container bucket
      Key: carFileName,
      Body: carBuffer,
      Metadata: {
        import: 'car',
      },
    });

    const response = await s3Client.send(command);

    // Filebase returns the pinned IPFS CID in the x-amz-meta-cid header
    const cid = (response.$metadata as any).httpResponse?.headers?.['x-amz-meta-cid'] || cidFromPack;

    if (!cid) {
      throw new Error('Filebase did not return a CID in the x-amz-meta-cid header.');
    }

    // Cleanup the local CAR buffer from disk
    try {
      fs.unlinkSync(outCarPath);
    } catch (e) {}

    return Array.isArray(cid) ? cid[0] : cid;
  } catch (err: any) {
    console.error('FILEBASE UPLOAD ERROR:', err.message);
    throw err;
  }
}
