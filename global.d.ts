import type { Annotation } from '@/lib/types';

declare module '*.svg' {
  const content: string;
  export default content;
}

declare global {
  interface Document {
    webkitFullscreenElement: Element | null;
    mozFullScreenElement: Element | null;
  }

  interface Window {
    authoringValue: Partial<Annotation> | undefined;
  }

  var gapi: {
    load: (name: string, callback: () => void) => void;
    client: {
      init: (config: { apiKey: string }) => Promise<void>;
    };
  };
}

declare module 'yup';
declare module 'preload-it';

export {};
