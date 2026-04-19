import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { adminDb } from '@/lib/firebase/server';
import { useFirebaseEmulators, firebaseEmulatorConfig, firebaseConfig } from '@/lib/config';

// Robust Emulator Fix: Ensure host variables are set in the worker context
if (useFirebaseEmulators && !process.env.FIRESTORE_EMULATOR_HOST) {
  process.env.FIRESTORE_EMULATOR_HOST = `${firebaseEmulatorConfig.firestore.host}:${firebaseEmulatorConfig.firestore.port}`;
  process.env.FIREBASE_STORAGE_EMULATOR_HOST = `${firebaseEmulatorConfig.storage.host}:${firebaseEmulatorConfig.storage.port}`;
  console.log(`[API GCS] Fail-safe Emulator Injection: Firestore (${process.env.FIRESTORE_EMULATOR_HOST}), Storage (${process.env.FIREBASE_STORAGE_EMULATOR_HOST})`);
}

// Authorization Guard: Verifies if the FileID is officially managed by NIIIFTY
const verifyFileId = unstable_cache(
  async (fileId: string) => {
    try {
      const doc = await adminDb.collection('files').doc(fileId).get();
      return doc.exists;
    } catch (error: any) {
      console.error('Firestore GCS Verification Guard Error Detail:', error);
      throw error;
    }
  },
  ['gcs-verification'],
  { 
    revalidate: 3600, // Cache for 1 hour
    tags: ['gcs'] 
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
    let isAuthorized = false;
    try {
      isAuthorized = await verifyFileId(fileId);
    } catch (authError: any) {
      return new NextResponse(JSON.stringify({ 
        error: 'Forbidden: GCS Verification Guard Failure',
        details: authError.code || authError.message || 'Unknown verification error'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!isAuthorized) {
      return new NextResponse(JSON.stringify({ 
        error: 'Unauthorized: File not managed by NIIIFTY' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Storage Resolution
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
        return new NextResponse(JSON.stringify({ error: 'Asset not found on GCS' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new NextResponse(JSON.stringify({ error: `GCS Gateway Error: ${proxyResponse.statusText}` }), {
        status: proxyResponse.status,
        headers: { 'Content-Type': 'application/json' },
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
