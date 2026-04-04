import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';

// Simplified verification function for debugging
// Temporarily removed unstable_cache to isolate potential cache-related permission issues
async function verifyIpnsKey(ipnsKey: string) {
  try {
    const querySnapshot = await adminDb
      .collection('files')
      .where('ipnsName', '==', ipnsKey)
      .limit(1)
      .get();
    
    return !querySnapshot.empty;
  } catch (error: any) {
    // Detailed error logging for production debugging
    console.error('Firestore Verification Guard Error Detail:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      name: error.name,
      details: error.details,
    });
    // Re-throw so the main catch block handles the 500 response
    throw error;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ipnsKey: string; path: string[] }> }
) {
  const resolvedParams = await params;
  const ipnsKey = resolvedParams.ipnsKey;
  const pathParts = resolvedParams.path || [];
  const relativePath = pathParts.join('/');

  try {
    // 1. Store Verification Guard
    let isAuthorized = false;
    try {
      isAuthorized = await verifyIpnsKey(ipnsKey);
    } catch (authError: any) {
      // If we hit a permission error at the guard level, return a 403 Forbidden with details
      return new NextResponse(JSON.stringify({ 
        error: 'Forbidden: Verfication Guard Failure',
        details: authError.code || authError.message || 'Unknown verification error'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!isAuthorized) {
      return new NextResponse(JSON.stringify({ 
        error: 'Unauthorized: IPNS Key not managed by NIIIFTY' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. IPNS Resolution
    const response = await fetch(`https://name.web3.storage/name/${ipnsKey}`, {
      next: { revalidate: 300 }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return new NextResponse(JSON.stringify({ error: 'IPNS record not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new NextResponse(JSON.stringify({ error: `Failed to resolve IPNS: ${response.statusText}` }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    
    const cid = data.value.replace('/ipfs/', '');
    
    const destinationUrl = relativePath 
      ? `https://${cid}.ipfs.w3s.link/${relativePath}`
      : `https://${cid}.ipfs.w3s.link/`;

    // Server-side streaming proxy
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

    // Stream the data directly to the client
    return new NextResponse(proxyResponse.body, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'Content-Type': proxyResponse.headers.get('content-type') || 'application/octet-stream',
        'Access-Control-Allow-Origin': '*',
      }
    });

  } catch (error: any) {
    console.error('IPNS Resolution Error Proxy:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
