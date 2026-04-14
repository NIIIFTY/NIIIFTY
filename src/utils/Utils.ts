import { default as slug } from 'slugify';
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import { FileSystem, SavedFile } from './Types';
import config from '../../niiifty.config';

// stackoverflow.com/questions/1322732/convert-seconds-to-hh-mm-ss-with-javascript
export const toHHMMSS = (seconds: number) => {
  // console.log("seconds", seconds);
  return new Date(seconds * 1000).toISOString().substr(11, 8);
};

export const fileToJson = (file: SavedFile) => {
  return {
    ...file,
    created: file.created?.toMillis() || 0,
    modified: file.modified?.toMillis() || 0,
  };
};

export const capitalizeFirstLetter = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export const slugify = (title: string): string => {
  return slug(title, {
    replacement: '-', // replace spaces with replacement character, defaults to `-`
    remove: undefined, // remove characters that match regex, defaults to `undefined`
    lower: true, // convert to lower case, defaults to `false`
    strict: true, // strip special characters except replacement, defaults to `false`
    locale: 'en', // language code of the locale to use
    trim: true, // trim leading and trailing replacement chars, defaults to `true`
  });
};

// https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript/34842797#34842797
export const hash2 = (value: string) => {
  return value.split('').reduce((prevHash, currVal) => ((prevHash << 5) - prevHash + currVal.charCodeAt(0)) | 0, 0);
};

import { useFirebaseEmulators, firebaseEmulatorConfig } from '@/lib/config';

export const getFileUrl = (
  fs: FileSystem,
  fsID: string, // the bucket id for GCS or the CID for IPFS
  name: string,
  ipnsName?: string,
) => {
  if (fs === 'GCS') {
    const firebaseConfig = config.environments[config.environment].firebaseConfig;
    if (useFirebaseEmulators) {
      return `http://${firebaseEmulatorConfig.storage.host}:${firebaseEmulatorConfig.storage.port}/v0/b/${firebaseConfig.storageBucket}/o/${encodeURIComponent(`${fsID}/${name}`)}?alt=media`;
    }
    return `https://${firebaseConfig.storageBucket}.storage.googleapis.com/${fsID}/${name}`;
  } else {
    let baseUrl = '';
    if (typeof window !== 'undefined') {
      baseUrl = window.location.origin;
    } else {
      const env = config.environments[config.environment];
      baseUrl = process.env.NODE_ENV === 'development' ? config.localhost.replace(/\/$/, '') : env.site;
    }
    return `${baseUrl}/api/ipfs/${fsID}/${name}`;
  }
};

export const getThumbnailUrl = (fs: FileSystem, fileId: string) => {
  return getFileUrl(fs, `thumb.jpg`, fileId);
};

export const copyText = (text: string) => {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  document.execCommand('copy');
  document.body.removeChild(textArea);
};

export function formatBytes(bytes: number | string, decimals = 2) {
  const numericBytes = typeof bytes === 'string' ? parseFloat(bytes) : bytes;
  if (!+numericBytes) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(numericBytes) / Math.log(k));

  return `${parseFloat((numericBytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
