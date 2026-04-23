'use server';

import { revalidateTag } from 'next/cache';
import { adminDb } from '@/lib/firebase/server';

export async function revalidateFile(fileId: string, cid?: string) {
  try {
    // Purge GCS specific cache
    revalidateTag(`file-${fileId}`, {});
    
    // Resolve CID if not provided to purge IPFS specific cache
    let resolvedCid = cid;
    if (!resolvedCid) {
       const doc = await adminDb.collection('files').doc(fileId).get();
       resolvedCid = doc.data()?.cid;
    }

    if (resolvedCid) {
      revalidateTag(`cid-${resolvedCid}`, {});
    }

    console.log(`[Server Action] Revalidated cache for file: ${fileId}${resolvedCid ? ` and CID: ${resolvedCid}` : ''}`);
    return { success: true };
  } catch (error) {
    console.error('[Server Action] Revalidation failed:', error);
    return { success: false, error: 'Revalidation failed' };
  }
}
