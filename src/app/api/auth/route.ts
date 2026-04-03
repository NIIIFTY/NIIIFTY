import { NextRequest, NextResponse } from 'next/server';

// see proxy.ts
export async function GET(request: NextRequest) {
  return new NextResponse('Auth Required.', {
    status: 401,
    headers: {
      'WWW-authenticate': 'Basic realm="Secure Area"',
    },
  });
}
