import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ipnsKey: string; path: string[] }> }
) {
  const resolvedParams = await params;
  const ipnsKey = resolvedParams.ipnsKey;
  const pathParts = resolvedParams.path || [];
  const relativePath = pathParts.join('/');

  try {
    // Query Web3.Storage's native IPNS Name resolver API
    // We cache this fetch for 5 minutes (300 seconds) so that heavy tile loads (which fire 100s of requests)
    // only resolve the IPNS record once, preventing rate limit blocks.
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
    
    // data.value is in the format `/ipfs/<cid>` e.g. `/ipfs/bafy...`
    // We want to construct `https://<cid>.ipfs.w3s.link/<relativePath>`
    const cid = data.value.replace('/ipfs/', '');
    
    const destinationUrl = relativePath 
      ? `https://${cid}.ipfs.w3s.link/${relativePath}`
      : `https://${cid}.ipfs.w3s.link/`;

    // Server-side streaming proxy
    // We fetch the tile directly on the server and pipe it to the client.
    // This eliminates 302 redirects and TLS handshakes for every tile on the client-side.
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
        // Cache heavy asset streaming (like imagery) for 1 hour locally depending on your needs.
        // IPNS generally updates over longer periods, but tiles are usually immutable paths anyway.
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'Content-Type': proxyResponse.headers.get('content-type') || 'application/octet-stream',
        'Access-Control-Allow-Origin': '*',
      }
    });

  } catch (error: any) {
    console.error('IPNS Resolution Error:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
