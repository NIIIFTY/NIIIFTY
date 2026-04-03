export function getProxyUrl(ipnsName: string, path = '') {
  const siteUrl = process.env.FUNCTIONS_EMULATOR === 'true' ? 'http://localhost:3000' : 'https://niiifty.com';
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${siteUrl}/api/ipns/${ipnsName}${cleanPath ? `/${cleanPath}` : ''}`;
}
