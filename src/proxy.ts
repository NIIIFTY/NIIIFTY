import { NextRequest, NextResponse } from 'next/server';
import { hash2 } from './utils/Utils';
import { basicAuthDisabled, isProduction } from '@/utils/Config';

export const config = {
  matcher: ['/:path*'],
};

const PUBLIC_PATHS = ['/_next/', '/favicon.ico', '/api/ipns/'];

export default function proxy(req: NextRequest) {
  const url = req.nextUrl;

  // 1. Production-Only & Config Guard
  // Bypass if disabled in config or if we are on localhost
  if (basicAuthDisabled || !isProduction) {
    return NextResponse.next();
  }

  // 2. Public Whitelist Path Guard
  // Ensure IIIF manifests and static assets are always public
  if (PUBLIC_PATHS.some((path) => url.pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const basicAuth = req.headers.get('authorization');

  if (basicAuth) {
    const authHeader = basicAuth.split(' ')[1];
    const [user, pwd] = atob(authHeader).split(':');

    // 3. Credential Check (Environment Variables Only)
    const envUser = process.env.BASIC_AUTH_USER;
    const envPass = process.env.BASIC_AUTH_PASS;

    if (envUser && envPass) {
      if (user === envUser && pwd === envPass) {
        return NextResponse.next();
      }
    } else {
      console.warn('Basic Auth credentials missing in production environment variables.');
    }
  }

  // 4. Challenge Rewrite
  // This directs the user to /api/auth which triggers the browser 401 prompt
  url.pathname = '/api/auth';
  return NextResponse.rewrite(url);
}
