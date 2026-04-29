import { useUserStore } from '@/store/user-store';
import { auth } from '@/lib/firebase';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function NavItems() {
  const { t } = useTranslation();
  const { username } = useUserStore();
  const router = useRouter();

  const signOut = () => {
    auth.signOut();
    router.push('/');
  };

  return (
    <>
      <li>
        <Link
          href="/search"
          className="text-base text-black no-underline transition-colors duration-500 hover:text-gray-600 dark:text-white"
        >
          {t('search')}
        </Link>
      </li>
      {username && (
        <li>
          <Link
            href="/admin/"
            className="text-base text-black no-underline transition-colors duration-500 hover:text-gray-600"
          >
            {t('myFiles')}
          </Link>
        </li>
      )}
      {/* <li>
        <Link href="/docs/">
          <a className="text-base text-black no-underline transition-colors duration-500 hover:text-gray-600">
            <>{t("docs")}</>
          </a>
        </Link>
      </li>
      {!authoringState && (
        <li>
          <Link href="/contact">
            <a className="text-base text-black no-underline transition-colors duration-500 hover:text-gray-600">
              <>{t("contact")}</>
            </a>
          </Link>
        </li>
      )} */}
      {username && (
        <li>
          <a
            onClick={signOut}
            role="menuitem"
            className="cursor-pointer text-base text-black no-underline transition-colors duration-500 hover:text-gray-600"
          >
            <>{t('signOut')}</>
          </a>
        </li>
      )}
    </>
  );
}
