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
        <Trans i18nKey="homePara2">
          This platform improves the reliability of <a href="https://iiif.io">IIIF</a> content by leveraging the
          content-addressed immutability and decentralized retrieval properties of <a href="https://ipfs.io/">IPFS</a>.
          This makes it ideal for use in third-party applications such as <a href="https://exhibit.so">Exhibit</a>. It
          is built on top of <a href="https://firebase.google.com/">Firebase</a> and
          <a href="https://web3.storage/">web3.storage</a> using <a href="https://nextjs.org/">Next.js</a> and
          <a href="https://tailwindcss.com/">TailwindCSS</a>.
        </Trans>
      </p>
      <br />
      <p className="text-md">
        <Trans i18nKey="homePara3">
          NIIIFTY is a project funded by
          <a href="https://github.com/filecoin-project/devgrants/issues/504">Protocol Labs Dev Grant #504</a> and built
          by <a href="https://twitter.com/edsilv">Edward Silverton</a> at <a href="https://mnemoscene.io">Mnemoscene</a>
          . Please contact <a href="https://twitter.com/edsilv">Edward</a> for details of how to access this online
          demo, or refer to the <a href="/docs">docs</a> to set up your own instance.
        </Trans>
      </p>
      <div className="mx-auto mt-8 max-w-sm">
        <UploadFilesButton.Large href="/admin" />
      </div>
      <div className="mx-auto mt-16 max-w-md lg:max-w-3xl">
        <iframe
          className="mx-auto h-[243px] lg:h-[416px]"
          width="100%"
          src="https://www.youtube.com/embed/OohBvWDvrIc"
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      </div>
    </>
  );
}
