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
          uploadAFile: 'Upload a File',
          uploadProgress: 'Uploading {{progress}}%',
          username: 'Username',
          usernameHelpText: 'Choose a unique username to identify your content on NIIIFTY.',
          usernameInvalid:
            'Please use 2 to 15 letters, numbers, underscores, or full stops. Underscores and full stops must not be at the start or end, or used sequentially.',
          features: 'Features',
          homePara1:
            'NIIIFTY simplifies the sharing of IIIF-formatted high-resolution images, 3D models, and audiovisual content via IPFS.',
          homePara2:
            'This platform improves the reliability of <1>IIIF</1> content by leveraging the content-addressed immutability and decentralized retrieval properties of <3>IPFS</3>. This makes it ideal for use in third-party applications such as <5>Exhibit</5>. It is built on top of <7>Firebase</7> and <9>web3.storage</9> using <11>Next.js</11> and <13>TailwindCSS</13>.',
          homePara3:
            'NIIIFTY is a project funded by <1>Protocol Labs Dev Grant #504</1> and built by <3>Edward Silverton</3> at <5>Mnemoscene</5>. Please contact <7>Edward</7> for details of how to access this online demo, or refer to the <9>docs</9> to set up your own instance.',
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
