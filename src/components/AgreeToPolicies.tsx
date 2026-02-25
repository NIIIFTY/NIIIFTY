import { useTranslation } from 'react-i18next';

export function AgreeToPolicies({ onAgreeToPolicies }: { onAgreeToPolicies: (agreed: boolean) => void }) {
  const { t } = useTranslation();

  return (
    <div className="flex items-start">
      <input
        type="checkbox"
        id="agree-to-policies"
        className="mt-0.5 mr-2 h-5 w-5 shrink-0"
        onChange={(e) => {
          onAgreeToPolicies(e.target.checked);
        }}
      />
      <label htmlFor="agree-to-policies" className="text-sm">
        <>{t('iHaveReadAndAgreedToNIIIFTYs')}</>{' '}
        <a href="/docs/terms-of-service" rel="noopener noreferrer" target="_blank">
          <>{t('termsOfService')}</>
        </a>{' '}
        <>{t('and')}</>{' '}
        <a href="/docs/privacy-policy" rel="noopener noreferrer" target="_blank">
          <>{t('privacyPolicy')}</>
        </a>
      </label>
    </div>
  );
}
