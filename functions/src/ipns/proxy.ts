export function getProxyUrl(target: string, path = '', type: 'ipns' | 'ipfs' = 'ipns') {
  const siteUrl = process.env.FUNCTIONS_EMULATOR === 'true' ? 'http://localhost:3000' : 'https://niiifty.com';
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const apiBase = type === 'ipns' ? '/api/ipns/' : '/api/ipfs/';
  return `${siteUrl}${apiBase}${target}${cleanPath ? `/${cleanPath}` : ''}`;
}
