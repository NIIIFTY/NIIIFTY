'use client';

import UploadFilesButton from '@/components/files/UploadFilesButton';
import { useTranslation, Trans } from 'react-i18next';

export default function HomeClient() {
  const { t } = useTranslation();

  return (
    <>
      <h2 className="mb-4 text-2xl font-bold">{t('homeWhatItDoesTitle')}</h2>
      <p className="mb-4 text-lg">
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
        <h2 className="mb-6 text-center text-2xl font-bold">{t('homeHowItWorksTitle')}</h2>

        <div className="mb-8 flex flex-col items-center justify-center gap-4 text-center text-sm font-semibold md:flex-row">
          <div className="rounded-lg bg-white/10 px-4 py-2 dark:bg-black/10">{t('homeHowItWorksStep1')}</div>
          <div className="hidden text-gray-500 md:block">→</div>
          <div className="text-gray-500 md:hidden">↓</div>
          <div className="rounded-lg bg-white/10 px-4 py-2 dark:bg-black/10">{t('homeHowItWorksStep2')}</div>
          <div className="hidden text-gray-500 md:block">→</div>
          <div className="text-gray-500 md:hidden">↓</div>
          <div className="rounded-lg bg-white/10 px-4 py-2 dark:bg-black/10">{t('homeHowItWorksStep3')}</div>
        </div>

        <div className="mx-auto grid max-w-full grid-cols-1 gap-8 px-4 md:grid-cols-2 lg:max-w-6xl">
          <div>
            <h3 className="mb-4 text-center text-xl font-semibold">Publish via AT Protocol</h3>
            <video
              className="mx-auto w-full rounded-xl shadow-2xl"
              src="/niiifty-demo.mp4"
              autoPlay
              loop
              muted
              playsInline
              controls
            />
          </div>
          <div>
            <h3 className="mb-4 text-center text-xl font-semibold">Discover via Semantic Search</h3>
            <video
              className="mx-auto w-full rounded-xl shadow-2xl"
              src="/search.mp4"
              autoPlay
              loop
              muted
              playsInline
              controls
            />
          </div>
        </div>
      </div>
    </>
  );
}
