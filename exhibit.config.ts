import { FileSystem } from '@/utils/Types';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export interface ItemFormatSettings {
  enabled: boolean;
}

export interface FileSystemSettings {
  enabled: boolean;
}

export interface Environment {
  anonymousCreateEnabled: boolean;
  anonymousEditEnabled: boolean;
  attributionLogoEnabled: boolean;
  checkoutUrl: string;
  copyExhibitDataEnabled: boolean;
  defaultBackgroundColor: string;
  defaultDuration: number;
  demoSite: boolean;
  emailLinkDomains: string[];
  fileUploadEnabled: boolean;
  firebaseConfig: FirebaseConfig;
  itemFormats: { [key: string]: ItemFormatSettings };
  maxFileSize: number; // 200MB
  recaptchaSiteKey: string;
  signInPriority: 'anonymous' | 'emailLink';
  site: string;
  storageFileSystems: { [key in FileSystem]: FileSystemSettings };
  uploadUrl: string;
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
      anonymousCreateEnabled: true,
      anonymousEditEnabled: true,
      attributionLogoEnabled: false,
      checkoutUrl: 'https://buy.polar.sh/polar_cl_MyLUB1uVi7Oe7FfrkwfbA6WhDKsDtRmHX8RUn4IMKLu',
      copyExhibitDataEnabled: false,
      defaultBackgroundColor: '#ffffff',
      defaultDuration: 10,
      demoSite: true,
      emailLinkDomains: ['mnemoscene.io'],
      fileUploadEnabled: false,
      maxFileSize: 209715200, // 200MB
      recaptchaSiteKey: '6LdYaL4ZAAAAAA7C28K_8dlHbFeGm7sLMDN3ga6K',
      signInPriority: 'emailLink',
      site: 'https://exhibit.so',
      uploadUrl: '',
      firebaseConfig: {
        apiKey: 'AIzaSyDo_GRo83y6OH-nh_E3ORvoXvgPXRpexro',
        authDomain: 'niiifty-bd2e2.firebaseapp.com',
        projectId: 'niiifty-bd2e2',
        storageBucket: 'niiifty-bd2e2.appspot.com',
        messagingSenderId: '267846307035',
        appId: '1:267846307035:web:f4b7bc95168ec5e2d850fe',
        measurementId: 'G-Y269GKG4ZE',
      },
      itemFormats: {
        iiif: {
          enabled: true,
        },
        youTube: {
          enabled: false,
        },
      },
      storageFileSystems: {
        GCS: {
          enabled: true,
        },
        IPFS: {
          enabled: false,
        },
      },
    },
    staging: {
      anonymousCreateEnabled: true,
      anonymousEditEnabled: true,
      attributionLogoEnabled: false,
      checkoutUrl: 'https://buy.polar.sh/polar_cl_MyLUB1uVi7Oe7FfrkwfbA6WhDKsDtRmHX8RUn4IMKLu',
      copyExhibitDataEnabled: false,
      defaultBackgroundColor: '#ffffff',
      defaultDuration: 10,
      demoSite: true,
      emailLinkDomains: ['mnemoscene.io', 'bl.uk', 'bodleian.ox.ac.uk', 'cam.ac.uk', 'crkn.ca', 'rpmt.org.uk'],
      fileUploadEnabled: true,
      maxFileSize: 209715200, // 200MB
      recaptchaSiteKey: '6LdYaL4ZAAAAAA7C28K_8dlHbFeGm7sLMDN3ga6K',
      signInPriority: 'anonymous',
      site: 'https://staging.exhibit.so',
      uploadUrl: '',
      firebaseConfig: {
        apiKey: 'AIzaSyC3pM0EKK4NfX21KMsOU-ldkBVshdDmDkE',
        authDomain: 'exhibit-staging-eea8b.firebaseapp.com',
        projectId: 'exhibit-staging-eea8b',
        storageBucket: 'exhibit-staging-eea8b.appspot.com',
        messagingSenderId: '42800390262',
        appId: '1:42800390262:web:995f90928d11097ff9bf57',
        measurementId: 'G-B9XHV5TCNJ',
      },
      itemFormats: {
        iiif: {
          enabled: true,
        },
        youTube: {
          enabled: true,
        },
      },
      storageFileSystems: {
        GCS: {
          enabled: true,
        },
        IPFS: {
          enabled: false,
        },
      },
    },
  },
} as Config;
