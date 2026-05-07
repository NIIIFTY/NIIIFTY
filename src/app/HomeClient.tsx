'use client';

import UploadFilesButton from '@/components/files/UploadFilesButton';
import { useTranslation, Trans } from 'react-i18next';

export default function HomeClient() {
  const { t } = useTranslation();

  return (
    <>
      <p className="text-xl font-semibold">{t('homePara1')}</p>
      <br />
      <p className="text-md">
        <Trans
          i18nKey="homePara2"
          components={{
            1: <a href="https://iiif.io" className="underline" />,
            3: <a href="https://matadisco.org/" className="underline" />,
            5: <a href="https://atproto.com/" className="underline" />,
            7: <a href="https://ipfs.io/" className="underline" />,
            9: <a href="https://exhibit.so" className="underline" />,
            11: <a href="https://mnemoscene.io" className="underline" />,
            13: <a href="https://ipfsgrants.io/utility-grants/" className="underline" />,
            15: <a href="https://filebase.com/" className="underline" />,
            17: <a href="https://firebase.google.com/" className="underline" />,
            19: <a href="https://nextjs.org/" className="underline" />,
            21: <a href="https://github.com/niiifty" className="underline" />,
          }}
        />
      </p>
      <div className="mx-auto mt-8 max-w-sm">
        <UploadFilesButton.Large href="/admin" />
      </div>
      {/* <div className="mx-auto mt-16 max-w-md lg:max-w-3xl">
        <iframe
          className="mx-auto h-[243px] lg:h-[416px]"
          width="100%"
          src="https://www.youtube.com/embed/OohBvWDvrIc"
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      </div> */}
    </>
  );
}
