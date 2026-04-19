import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { adminDb } from '@/lib/firebase/server';
import { useFirebaseEmulators, firebaseEmulatorConfig } from '@/lib/config';
import { generateIIIFManifest } from '@/lib/iiif-generator';
import { NiiiftyFile } from '@/types/file';

// Robust Emulator Fix: Ensure host variables are set in the worker context
if (useFirebaseEmulators && !process.env.FIRESTORE_EMULATOR_HOST) {
  process.env.FIRESTORE_EMULATOR_HOST = `${firebaseEmulatorConfig.firestore.host}:${firebaseEmulatorConfig.firestore.port}`;
  process.env.FIREBASE_STORAGE_EMULATOR_HOST = `${firebaseEmulatorConfig.storage.host}:${firebaseEmulatorConfig.storage.port}`;
  console.log(`[API IPFS] Fail-safe Emulator Injection: Firestore (${process.env.FIRESTORE_EMULATOR_HOST}), Storage (${process.env.FIREBASE_STORAGE_EMULATOR_HOST})`);
}

// Authorization Guard: Verifies if the CID is officially managed by NIIIFTY
const verifyCid = unstable_cache(
  async (cid: string): Promise<NiiiftyFile | null> => {
    try {
      const querySnapshot = await adminDb
        .collection('files')
        .where('cid', '==', cid)
        .limit(1)
        .get();
      
      if (querySnapshot.empty) return null;
      
      const doc = querySnapshot.docs[0];
      return { fileId: doc.id, ...doc.data() } as NiiiftyFile;
    } catch (error: any) {
      console.error('Firestore Verification Guard Error Detail:', error);
      throw error;
    }
  },
  ['ipfs-verification'],
  { 
    revalidate: 3600, // Cache for 1 hour
    tags: ['ipfs', 'files'] 
  }
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ cid: string; path: string[] }> }
) {
  const resolvedParams = await params;
  const cid = resolvedParams.cid;
  const pathParts = resolvedParams.path || [];
  const relativePath = pathParts.join('/');

  try {
    // 1. Store Verification Guard
    let metadata: NiiiftyFile | null = null;
    try {
      metadata = await verifyCid(cid);
    } catch (authError: any) {
      return new NextResponse(JSON.stringify({ 
        error: 'Forbidden: Verification Guard Failure',
        details: authError.code || authError.message || 'Unknown verification error'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!metadata) {
      return new NextResponse(JSON.stringify({ 
        error: 'Unauthorized: CID not managed by NIIIFTY' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Pure Dynamic Manifest Interception
    if (relativePath === 'iiif/index.json') {
      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      const host = request.headers.get('host');
      const basePath = `${protocol}://${host}/api/ipfs/${cid}`;
      
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

    // 3. Gateway Resolution
    const gatewayBaseUrl = process.env.FILEBASE_GATEWAY_URL || 'https://ipfs.filebase.io';
    
    const destinationUrl = relativePath 
      ? `${gatewayBaseUrl}/ipfs/${cid}/${relativePath}`
      : `${gatewayBaseUrl}/ipfs/${cid}/`;

    // Fetch the asset from the IPFS gateway
    const proxyResponse = await fetch(destinationUrl);

    if (!proxyResponse.ok) {
      if (proxyResponse.status === 404) {
        return new NextResponse(JSON.stringify({ error: 'Asset not found on IPFS' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new NextResponse(JSON.stringify({ error: `IPFS Gateway Error: ${proxyResponse.statusText}` }), {
        status: proxyResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Dynamic Version Pinning (URL rewriting for JSON manifests)
    if (relativePath.endsWith('.json')) {
      const jsonText = await proxyResponse.text();
      
      // Replace the __CID__ placeholder with the actual CID from the request URL
      // This allows NIIIFTY to generate absolute, pinned links without knowing the CID beforehand.
      const rewrittenJsonText = jsonText.replaceAll('__CID__', cid);

      return new NextResponse(rewrittenJsonText, {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    // Stream other binary data natively
    return new NextResponse(proxyResponse.body, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'Content-Type': proxyResponse.headers.get('content-type') || 'application/octet-stream',
        'Access-Control-Allow-Origin': '*',
      }
    });

  } catch (error: any) {
    console.error('IPFS Pinned Resolution Proxy Error:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
