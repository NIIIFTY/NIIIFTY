import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { adminDb } from '@/lib/firebase/server';
import { useFirebaseEmulators, firebaseEmulatorConfig, firebaseConfig } from '@/lib/config';
import { generateIIIFManifest } from '@/lib/iiif-generator';
import { NiiiftyFile } from '@/types/file';

// Robust Emulator Fix: Ensure host variables are set in the worker context
if (useFirebaseEmulators && !process.env.FIRESTORE_EMULATOR_HOST) {
  process.env.FIRESTORE_EMULATOR_HOST = `${firebaseEmulatorConfig.firestore.host}:${firebaseEmulatorConfig.firestore.port}`;
  process.env.FIREBASE_STORAGE_EMULATOR_HOST = `${firebaseEmulatorConfig.storage.host}:${firebaseEmulatorConfig.storage.port}`;
  console.log(`[API GCS] Fail-safe Emulator Injection: Firestore (${process.env.FIRESTORE_EMULATOR_HOST}), Storage (${process.env.FIREBASE_STORAGE_EMULATOR_HOST})`);
}

// Authorization Guard: Verifies if the FileID is officially managed by NIIIFTY
const verifyFileId = unstable_cache(
  async (fileId: string): Promise<NiiiftyFile | null> => {
    try {
      const doc = await adminDb.collection('files').doc(fileId).get();
      if (!doc.exists) return null;
      return { fileId: doc.id, ...doc.data() } as NiiiftyFile;
    } catch (error: any) {
      console.error('Firestore GCS Verification Guard Error Detail:', error);
      throw error;
    }
  },
  ['gcs-verification'],
  { 
    revalidate: 3600, 
    tags: ['gcs', 'files'] // The specific fileId tag will be added via the cache key automatically in some Next.js versions, but we should be explicit if we use revalidateTag(fileId)
  }
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ fileId: string; path: string[] }> }
) {
  const resolvedParams = await params;
  const fileId = resolvedParams.fileId;
  const pathParts = resolvedParams.path || [];
  const relativePath = pathParts.join('/');

  try {
    // 1. Store Verification Guard
    let metadata: NiiiftyFile | null = null;
    try {
      metadata = await verifyFileId(fileId);
    } catch (authError: any) {
      return new NextResponse(JSON.stringify({ 
        error: 'Forbidden: GCS Verification Guard Failure',
        details: authError.code || authError.message || 'Unknown verification error'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!metadata) {
      return new NextResponse(JSON.stringify({ 
        error: 'Unauthorized: File not managed by NIIIFTY' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Pure Dynamic Manifest Interception
    if (relativePath === 'index.json') {
      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
      const basePath = `${protocol}://${host}/api/gcs/${fileId}`;
      
      const manifest = generateIIIFManifest(basePath, metadata);

      return new NextResponse(JSON.stringify(manifest, null, 2), {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    // 3. Storage Resolution
    let destinationUrl = '';
    
    if (useFirebaseEmulators) {
      // Proxy to the local storage emulator
      destinationUrl = `http://${firebaseEmulatorConfig.storage.host}:${firebaseEmulatorConfig.storage.port}/v0/b/${firebaseConfig.storageBucket}/o/${fileId}%2F${encodeURIComponent(relativePath)}?alt=media`;
    } else {
      // Proxy to the production Google Cloud Storage
      destinationUrl = `https://storage.googleapis.com/${firebaseConfig.storageBucket}/${fileId}/${relativePath}`;
    }

    // Fetch the asset from GCS
    const proxyResponse = await fetch(destinationUrl);

    if (!proxyResponse.ok) {
      if (proxyResponse.status === 404) {
        return new NextResponse(JSON.stringify({ error: 'File not found on GCS' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new NextResponse(JSON.stringify({ error: `GCS Gateway Error: ${proxyResponse.statusText}` }), {
        status: proxyResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. Dynamic Version Pinning (URL rewriting for JSON manifests)
    if (relativePath.endsWith('.json')) {
      const jsonText = await proxyResponse.text();
      
      // Replace placeholders with actual values
      let rewrittenJsonText = jsonText
        .replaceAll('__FS__', 'gcs')
        .replaceAll('__ID__', fileId);

      return new NextResponse(rewrittenJsonText, {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    // Stream binary data natively
    return new NextResponse(proxyResponse.body, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'Content-Type': proxyResponse.headers.get('content-type') || 'application/octet-stream',
        'Access-Control-Allow-Origin': '*',
      }
    });

  } catch (error: any) {
    console.error('GCS Resolution Proxy Error:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
