import i18n from 'i18next';
// import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from 'react-i18next';

i18n
  // .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translations: {
          admin: 'Admin',
          attribution: 'Attribution',
          available: 'Available',
          browse: 'browse',
          cancel: 'Cancel',
          checking: 'checking...',
          chooseAUsername: 'Choose a username',
          cid: 'CID',
          confirmFileDeletion: 'Are you sure you want to delete "{{title}}"?',
          confirmRenameSlug:
            'Are you sure you want to change the title? This will mean that all existing links to "{{slug}}" will no longer work',
          contact: 'Contact',
          createAccount: 'Create Account',
          dash: 'Dash',
          delete: 'Delete',
          details: 'Details',
          docs: 'Docs',
          dragAndDropFiles: 'Drap & Drop your files or',
          edit: 'Edit',
          email: 'hello@mnemoscene.io',
          files: 'Files',
          fileNotFound: 'File not found',
          filesFound: '{{val}} files found.',
          fileTooLarge: 'File too large ({{val}} MB max)',
          fileTypeNotSupported: 'File type not supported',
          fullName: 'Full name',
          fullNameCannotBeEmpty: 'Full name cannot be empty',
          glb: 'GLB',
          googleCloudStorage: 'Google Cloud Storage',
          help: 'Help',
          hls: 'HLS',
          iHaveReadAndAgreedToNIIIFTYs: "I have read and agreed to NIIIFTY's",
          image: 'Image',
          isAvailable: '"{{val}}" is available.',
          iiif: 'IIIF',
          iiifManifest: 'IIIF Manifest',
          ipfs: 'IPFS',
          isInvalid: '"{{val}}" is invalid.',
          isTaken: '"{{val}}" is taken, please try another.',
          jpg: 'JPG',
          license: 'License',
          loading: 'Loading...',
          mnemosceneLtd: 'Mnemoscene LTD',
          modified: 'Modified',
          mp4: 'MP4',
          myFiles: 'My Files',
          next: 'Next',
          noFilesFound: 'No files found.',
          noMoreFiles: 'No more files.',
          pageNotFound: 'Page not found',
          pageNotFoundMessage: 'The page you are looking for does not exist.',
          getStartedByUploading: 'Get started by uploading your first high-resolution image, 3D model, or video.',
          noFilesYet: 'No files yet',
          pleaseEnterValue: 'Please enter a value',
          pleaseLimitToChars: 'Please limit to {{val, number}} characters',
          pleaseSignIn: 'Please Sign In',
          preview: 'Preview',
          privacyPolicy: 'Privacy Policy',
          regular: 'Regular',
          showMore: 'Show More',
          signIn: 'Sign in',
          signingIn: 'Signing in...',
          signInWithGoogle: 'Sign in with Google',
          signOut: 'Sign Out',
          siteName: 'NIIIFTY',
          small: 'Small',
          termsOfService: 'Terms of Service',
          thumbnail: 'Thumbnail',
          title: 'Title',
          titleInvalid:
            'Title must be at least one character and contain only letters, numbers, spaces, hyphens, and underscores.',
          type: 'Type',
          view: 'View',
          viewOnUVLink: 'View in Universal Viewer',
          viewOnW3SLink: 'View on web3.storage CDN',
          update: 'Update',
          uploadFiles: 'Upload Files',
          uploadFile: 'Upload File',
          uploadNewFile: 'Upload New File',
          uploadAFile: 'Upload a File',
          uploadProgress: 'Uploading {{progress}}%',
          username: 'Username',
          usernameHelpText: 'Choose a unique username to identify your content on NIIIFTY.',
          usernameInvalid:
            'Please use 2 to 15 letters, numbers, underscores, or full stops. Underscores and full stops must not be at the start or end, or used sequentially.',
          features: 'Features',
          homeWhatItDoesTitle: 'What it does',
          homeWhatItDoes:
            'NIIIFTY lets you upload high-resolution images, 3D models, and audiovisual files as <1>IIIF</1> manifests, stored immutably on <3>IPFS</3> and published for cross-institutional discovery via the <5>AT Protocol</5>. Think of it as a global index for IIIF content — interoperable with tools like <7>Exhibit.so</7> and searchable across the <9>Matadisco</9> network.',
          homeFunding:
            'Built by <1>Mnemoscene</1> with funding from <3>IPFS Implementations Grants</3>. View the project on <5>GitHub</5>.',
          homeHowItWorksTitle: 'How it Works',
          homeHowItWorksStep1: 'Upload files',
          homeHowItWorksStep2: 'Autogenerate metadata & tags',
          homeHowItWorksStep3: 'Publish to Matadisco network (ATProto) for discovery',
          search: 'Search',
          searchPlaceholder: 'Search for content...',
          searching: 'Searching...',
          noResultsFound: 'No results found for your query.',
        },
      },
    },
    fallbackLng: 'en',
    debug: false,

    // have a common namespace used around the full app
    ns: ['translations'],
    defaultNS: 'translations',

    keySeparator: false, // we use content as keys

    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
