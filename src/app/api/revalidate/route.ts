import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  const tag = request.nextUrl.searchParams.get('tag');

  if (secret !== process.env.NIIIFTY_REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  }

  if (!tag) {
    return NextResponse.json({ message: 'Missing tag' }, { status: 400 });
  }

  revalidateTag(tag);
  
  console.log(`[Revalidate] Purged cache for tag: ${tag}`);

  return NextResponse.json({ revalidated: true, now: Date.now() });
}
