import nodeFetch from 'node-fetch';

/**
 * Pings the Next.js revalidation endpoint to purge the manifest cache.
 */
export async function triggerRevalidation(tag: string) {
  const secret = process.env.NIIIFTY_REVALIDATE_SECRET;
  const appUrl = process.env.APP_URL || 'http://localhost:3000'; // Fallback for local testing
  
  if (!secret) {
    console.warn('[Revalidate] Skipping revalidation: NIIIFTY_REVALIDATE_SECRET not set.');
    return;
  }

  const url = `${appUrl}/api/revalidate?secret=${secret}&tag=${tag}`;
  
  try {
    const res = await nodeFetch(url);
    if (res.ok) {
      console.log(`[Revalidate] Successfully triggered revalidation for tag: ${tag}`);
    } else {
      const text = await res.text();
      console.error(`[Revalidate] Failed to trigger revalidation for tag: ${tag}. Status: ${res.status}. ${text}`);
    }
  } catch (err) {
    console.error(`[Revalidate] Error triggering revalidation for tag: ${tag}:`, err);
  }
}
