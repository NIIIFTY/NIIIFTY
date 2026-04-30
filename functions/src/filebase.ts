import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export async function uploadTempFilesToFilebase(tempDirPath: string, fileId: string): Promise<string> {
  const s3Client = new S3Client({
    endpoint: 'https://s3.filebase.com',
    region: 'us-east-1',
    credentials: {
      accessKeyId: process.env.FILEBASE_ACCESS_TOKEN || 'placeholder',
      secretAccessKey: process.env.FILEBASE_SECRET_KEY || 'placeholder',
    },
    forcePathStyle: true,
  });

  const carFileName = `${fileId}.car`;
  // Place the car buffer directly adjacent to the temp directory
  const outCarPath = path.join(path.dirname(tempDirPath), carFileName);

  try {
    // Pack the directory into a CAR file using ipfs-car CLI
    // This utilizes the stream encoder but guarantees the root CID is injected into the CAR header.
    console.log(`Packing ${tempDirPath} to ${outCarPath}`);
    const { stdout, stderr } = await execAsync(`npx ipfs-car pack "${tempDirPath}" --output "${outCarPath}"`);
    if (stderr) console.warn('IPFS-CAR Warning/Error:', stderr);
    
    const cidFromPack = stdout.trim();
    console.log(`IPFS-CAR stdout: ${cidFromPack}`);

    if (!fs.existsSync(outCarPath)) {
      throw new Error(`CAR file was not created at ${outCarPath}`);
    }

    const stats = fs.statSync(outCarPath);
    console.log(`CAR file size: ${stats.size} bytes`);

    if (stats.size === 0) {
      throw new Error(`CAR file is empty at ${outCarPath}`);
    }

    // Read the packed CAR file from disk into memory buffer limits
    const carBuffer = fs.readFileSync(outCarPath);

    // Upload to Filebase S3 API
    console.log(`Uploading ${carFileName} to Filebase S3 (Bucket: niiifty)...`);
    const command = new PutObjectCommand({
      Bucket: 'niiifty',
      Key: carFileName,
      Body: carBuffer,
      ContentType: 'application/vnd.ipld.car',
      Metadata: {
        import: 'car',
      },
    });

    console.log('Sending PutObjectCommand to Filebase...');
    const response = await s3Client.send(command);
    console.log('Filebase response received.');

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
    console.error('FILEBASE UPLOAD ERROR:', err);
    throw err;
  }
}

export async function deleteFilebaseFiles(fileId: string): Promise<void> {
  const s3Client = new S3Client({
    endpoint: 'https://s3.filebase.com',
    region: 'us-east-1',
    credentials: {
      accessKeyId: process.env.FILEBASE_ACCESS_TOKEN || 'placeholder',
      secretAccessKey: process.env.FILEBASE_SECRET_KEY || 'placeholder',
    },
  });

  try {
    console.log(`Deleting ${fileId}.car from Filebase S3...`);
    const command = new DeleteObjectCommand({
      Bucket: 'niiifty',
      Key: `${fileId}.car`,
    });
    
    await s3Client.send(command);
    console.log(`Successfully deleted ${fileId}.car from Filebase.`);
  } catch (err: any) {
    console.error('FILEBASE DELETION ERROR:', err.message);
    throw err;
  }
}
