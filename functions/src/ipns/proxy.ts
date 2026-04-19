export function getProxyUrl(target: string, path = '', type: 'ipfs' | 'gcs' = 'ipfs') {
  const siteUrl = process.env.FUNCTIONS_EMULATOR === 'true' ? 'http://localhost:3000' : 'https://niiifty.com';
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const apiBase = type === 'ipfs' ? '/api/ipfs/' : '/api/gcs/';
  return `${siteUrl}${apiBase}${target}${cleanPath ? `/${cleanPath}` : ''}`;
}
