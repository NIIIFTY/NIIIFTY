'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useTranslation } from 'react-i18next';

const CookiesPolicy = ({ className }: { className?: string | undefined }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [cookiesAccepted, setCookiesAccepted] = useLocalStorage('cookiesAccepted', false);
  const { t } = useTranslation();
  const c = cn('fixed bottom-0 flex w-full text-gray-900 bg-white text-base p-2', className);

  useEffect(() => {
    if (cookiesAccepted) {
      ref.current?.classList.add('hidden');
    } else {
      ref.current?.classList.remove('hidden');
    }
  }, [cookiesAccepted]);

  return (
    <div ref={ref} className={c} role="alert">
      <div className="w-8/12">
        <p className="px-2 py-4 text-sm lg:px-4 lg:py-6 lg:text-base">
          {t('cookies-banner-description')} {t('cookies-banner-read')}{' '}
          <a className="underline" href="/docs/cookies-policy">
            {t('cookies-banner-link-text')}
          </a>{' '}
          {t('cookies-banner-find-out-more')}
        </p>
      </div>
      <div className="w-4/12">
        <Button
          className="float-right m-4"
          onClick={() => {
            setCookiesAccepted(true);
          }}
        >
          {t('dismiss')}
        </Button>
      </div>
    </div>
  );
};

export default CookiesPolicy;
