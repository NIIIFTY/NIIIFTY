export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export interface ItemFormat {
  enabled: boolean;
}

export interface Environment {
  basicAuthDisabled: boolean;
  firebaseConfig: FirebaseConfig;
  site: string;
  theme: 'system' | 'light' | 'dark';
  headerTitle: string;
  title: string;
  description: string;
  maxFileSize: number;
}

export type EnvironmentType = 'default' | 'staging';

export interface Config {
  environment: EnvironmentType;
  localhost: string;
  environments: { [key in EnvironmentType]: Environment };
}

export default {
  environment: 'default',
  localhost: 'http://localhost:3000/',
  environments: {
    default: {
      basicAuthDisabled: true,
      site: 'https://niiifty.com',
      headerTitle: 'NIIIFTY',
      theme: 'system',
      title: 'NIIIFTY',
      description: 'Store large images, 3D models, and audio/video content as IIIF on IPFS.',
      maxFileSize: 209715200, // 200MB
      firebaseConfig: {
        apiKey: '', // set NEXT_PUBLIC_FIREBASE_API_KEY in .env.local
        authDomain: 'niiifty-bd2e2.firebaseapp.com',
        projectId: 'niiifty-bd2e2',
        storageBucket: 'niiifty-bd2e2.appspot.com',
        messagingSenderId: '267846307035',
        appId: '1:267846307035:web:f4b7bc95168ec5e2d850fe',
        measurementId: 'G-Y269GKG4ZE',
      },
    },
  },
} as Config;
