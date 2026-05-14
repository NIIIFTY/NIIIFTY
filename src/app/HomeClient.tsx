'use client';

import UploadFilesButton from '@/components/files/UploadFilesButton';
import { useTranslation, Trans } from 'react-i18next';

export default function HomeClient() {
  const { t } = useTranslation();

  return (
    <>
      <h2 className="text-2xl font-bold mb-4">{t('homeWhatItDoesTitle')}</h2>
      <p className="text-lg mb-4">
        <Trans
          i18nKey="homeWhatItDoes"
          components={{
            1: <a href="https://iiif.io" className="underline" />,
            3: <a href="https://ipfs.io/" className="underline" />,
            5: <a href="https://atproto.com/" className="underline" />,
            7: <a href="https://exhibit.so" className="underline" />,
            9: <a href="https://matadisco.org/" className="underline" />,
          }}
        />
      </p>
      
      <p className="text-md mb-8 text-gray-400">
        <Trans
          i18nKey="homeFunding"
          components={{
            1: <a href="https://mnemoscene.io" className="underline" />,
            3: <a href="http://ipfsgrants.io/" className="underline" />,
            5: <a href="https://github.com/niiifty" className="underline" />,
          }}
        />
      </p>

      <div className="mx-auto mt-8 max-w-sm">
        <UploadFilesButton.Large href="/admin" />
      </div>

      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-6 text-center">{t('homeHowItWorksTitle')}</h2>
        
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-8 text-center text-sm font-semibold">
          <div className="bg-white/10 dark:bg-black/10 px-4 py-2 rounded-lg">{t('homeHowItWorksStep1')}</div>
          <div className="text-gray-500">→</div>
          <div className="bg-white/10 dark:bg-black/10 px-4 py-2 rounded-lg">{t('homeHowItWorksStep2')}</div>
          <div className="text-gray-500">→</div>
          <div className="bg-white/10 dark:bg-black/10 px-4 py-2 rounded-lg">{t('homeHowItWorksStep3')}</div>
        </div>

        <div className="mx-auto max-w-md lg:max-w-4xl">
          <video
            className="mx-auto w-full rounded-xl shadow-2xl"
            src="/niiifty-demo.mp4"
            autoPlay
            loop
            muted
            playsInline
          />
        </div>
      </div>
    </>
  );
}
