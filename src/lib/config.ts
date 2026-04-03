import config, { EnvironmentType } from '../../niiifty.config';
import urljoin from 'url-join';

// is deployed on Vercel
export const isProduction = process.env.NODE_ENV === 'production';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);
const isServerRuntime = typeof window === 'undefined';

const isStaging = config.environment === 'staging';

// firebaseConfig won't work if using an env var
export const env: EnvironmentType = isStaging ? 'staging' : 'default';

if (isServerRuntime && !process.env.NODE_TLS_REJECT_UNAUTHORIZED) {
  // Allow self-signed certificates only for local development.
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const normaliseHost = (rawHost: string | undefined) => {
  if (!rawHost) {
    return undefined;
  }

  const stripped = rawHost.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const [host] = stripped.split(':');
  return host;
};

const isLocalhostHost = (host: string | undefined) => (host ? LOCAL_HOSTS.has(host) : false);

const resolveHostFromEnv = () => {
  const envHost = process.env.HOST ?? process.env.NEXT_PUBLIC_HOST ?? process.env.NEXT_PUBLIC_VERCEL_URL ?? undefined;
  return normaliseHost(envHost);
};

const emulatorPreference = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS ?? process.env.USE_FIREBASE_EMULATORS;

const emulatorPreferenceNormalised = emulatorPreference ? emulatorPreference.toLowerCase() : undefined;

const explicitEmulatorOptIn =
  emulatorPreferenceNormalised === 'true' ? true : emulatorPreferenceNormalised === 'false' ? false : undefined;

const inferLocalhost = () => {
  if (typeof window !== 'undefined') {
    return isLocalhostHost(window.location.hostname);
  }

  return isLocalhostHost(resolveHostFromEnv());
};

export const useFirebaseEmulators = !isProduction && (explicitEmulatorOptIn ?? inferLocalhost());

const readEnvValue = (...keys: string[]) => keys.map((key) => process.env[key]).find((value) => value?.length);

const parseEmulatorEndpoint = (
  hostValue: string | undefined,
  portValue: string | undefined,
  fallbackPort: number,
  fallbackHost = '127.0.0.1',
) => {
  let host = hostValue ? hostValue.replace(/^https?:\/\//, '') : fallbackHost;
  let port = Number(portValue);

  if (!Number.isFinite(port)) {
    if (host.includes(':')) {
      const [parsedHost, parsedPort] = host.split(':');
      host = parsedHost;
      port = Number(parsedPort);
    }
  }

  if (!Number.isFinite(port)) {
    port = fallbackPort;
  }

  host = host.replace(/\/$/, '');

  return { host, port } as const;
};

export const firebaseEmulatorConfig = {
  auth: parseEmulatorEndpoint(
    readEnvValue('NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST', 'FIREBASE_AUTH_EMULATOR_HOST'),
    readEnvValue('NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT', 'FIREBASE_AUTH_EMULATOR_PORT'),
    9099,
  ),
  firestore: parseEmulatorEndpoint(
    readEnvValue('NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST', 'FIRESTORE_EMULATOR_HOST'),
    readEnvValue('NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT', 'FIRESTORE_EMULATOR_PORT'),
    8080,
  ),
  functions: parseEmulatorEndpoint(
    readEnvValue('NEXT_PUBLIC_FUNCTIONS_EMULATOR_HOST', 'FUNCTIONS_EMULATOR_HOST'),
    readEnvValue('NEXT_PUBLIC_FUNCTIONS_EMULATOR_PORT', 'FUNCTIONS_EMULATOR_PORT'),
    5001,
  ),
  storage: parseEmulatorEndpoint(
    readEnvValue('NEXT_PUBLIC_STORAGE_EMULATOR_HOST', 'STORAGE_EMULATOR_HOST', 'FIREBASE_STORAGE_EMULATOR_HOST'),
    readEnvValue('NEXT_PUBLIC_STORAGE_EMULATOR_PORT', 'STORAGE_EMULATOR_PORT', 'FIREBASE_STORAGE_EMULATOR_PORT'),
    9199,
  ),
} as const;

const getApiUrl = () => {
  if (isProduction) {
    if (isStaging) {
      return urljoin(config.environments['staging'].site, 'api');
    }
    return urljoin(config.environments['default'].site, 'api');
  }

  return urljoin(config.localhost, 'api');
};

export const api = getApiUrl();
export const anonymousCreateEnabled = config.environments[env].anonymousCreateEnabled;
export const anonymousEditEnabled = config.environments[env].anonymousEditEnabled;
export const attributionLogoEnabled = config.environments[env].attributionLogoEnabled;
export const checkoutUrl = config.environments[env].checkoutUrl;
export const copyExhibitDataEnabled = config.environments[env].copyExhibitDataEnabled;
export const defaultBackgroundColor = config.environments[env].defaultBackgroundColor;
export const defaultDuration = config.environments[env].defaultDuration;
export const demoSite = config.environments[env].demoSite;
export const emailLinkDomains = config.environments[env].emailLinkDomains;
export const fileUploadEnabled = config.environments[env].fileUploadEnabled;
export const firebaseConfig = config.environments[env].firebaseConfig;
export const iiifEnabled = config.environments[env].itemFormats.iiif.enabled;
export const maxFileSize = config.environments[env].maxFileSize;
export const recaptchaSiteKey = config.environments[env].recaptchaSiteKey;
export const signInPriority = config.environments[env].signInPriority;
export const site = isProduction ? config.environments[env].site : config.localhost;
export const gcsEnabled = config.environments[env].storageFileSystems.GCS.enabled;
export const ipfsEnabled = config.environments[env].storageFileSystems.IPFS.enabled;
export const uploadUrl = config.environments[env].uploadUrl;
export const youTubeEnabled = config.environments[env].itemFormats.youTube.enabled;

// tailwindcss breakpoints
export const sm: number = 640;
export const md: number = 768;
export const lg: number = 1024;
export const xl: number = 1280;

// Animation durations (in seconds for OpenSeadragon, converted to ms for CSS)
export const presentationAnimationTime = 1; // seconds - used for viewer transitions in presentation mode
export const authoringAnimationTime = 0.3; // seconds - used for viewer transitions in authoring mode
export const overlayTransitionTime = 300; // milliseconds - used for overlay fade transitions
