import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Dialog } from '@headlessui/react';
import { useEffect, useState } from 'react';
import cx from 'classnames';
import { useTranslation } from 'react-i18next';
import { NavItems } from './NavItems';

export function NavPopover({
  display = 'md:hidden',
  className,
  ...props
}: {
  display?: string;
  className?: string;
  [key: string]: any;
}) {
  let [isOpen, setIsOpen] = useState(false);

  const pathname = usePathname();
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;

  useEffect(() => {
    setIsOpen(false);
  }, [pathname, searchParams]);

  return (
    <div className={cx(className, display)} {...props}>
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center text-slate-500 hover:text-slate-600"
        onClick={() => setIsOpen(true)}
      >
        <span className="sr-only">Navigation</span>
        <svg width="24" height="24" fill="none" aria-hidden="true">
          <path
            d="M12 6v.01M12 12v.01M12 18v.01M12 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm0 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm0 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <Dialog as="div" className={cx('fixed inset-0 z-50', display)} open={isOpen} onClose={setIsOpen}>
        <Dialog.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-sm dark:bg-slate-900/80" />
        <div className="dark:highlight-white/5 fixed top-4 right-4 w-full max-w-xs rounded-lg bg-white p-6 text-base font-semibold text-slate-900 shadow-lg dark:bg-slate-800 dark:text-slate-400">
          <button
            type="button"
            className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300"
            onClick={() => setIsOpen(false)}
          >
            <span className="sr-only">Close navigation</span>
            <svg viewBox="0 0 10 10" className="h-2.5 w-2.5 overflow-visible" aria-hidden="true">
              <path d="M0 0L10 10M10 0L0 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <ul className="list-none space-y-6 p-0">
            <NavItems />
          </ul>
        </div>
      </Dialog>
    </div>
  );
}

// hasNav and navIsOpen are used on tailwindcss.com to toggle the docs sidebar
// not using these for now - see _app.js in tailwindcss.com project
export function Header({
  hasNav = false,
  navIsOpen = false,
  onNavToggle = () => {},
}: {
  hasNav?: boolean;
  navIsOpen?: boolean;
  onNavToggle?: (isOpen: boolean) => void;
}) {
  const { t } = useTranslation();
  let [isOpaque, setIsOpaque] = useState(false);

  useEffect(() => {
    let offset = 50;
    function onScroll() {
      if (!isOpaque && window.scrollY > offset) {
        setIsOpaque(true);
      } else if (isOpaque && window.scrollY <= offset) {
        setIsOpaque(false);
      }
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      // @ts-ignore
      window.removeEventListener('scroll', onScroll, { passive: true });
    };
  }, [isOpaque]);

  return (
    <>
      {/* <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center overflow-hidden">
        <div className="flex w-[108rem] flex-none justify-end">
        </div>
      </div> */}
      <div
        className={cx(
          'fixed top-0 z-40 w-full flex-none backdrop-blur transition-colors duration-500 lg:z-50',
          isOpaque ? 'bg-white supports-backdrop-blur:bg-white/95' : 'bg-transparent',
        )}
      >
        <div className="layout-container">
          <div
            className={cx(
              'w-full py-4',
              hasNav ? 'mx-4 lg:mx-0' : '', //'px-4'
            )}
          >
            <div className="relative flex items-center">
              <Link
                href="/"
                className="mr-3 flex-none text-xl font-bold text-black no-underline hover:no-underline lg:text-2xl"
              >
                <span className="sr-only">home page</span>
                {t('siteName')}
              </Link>
              <div className="relative ml-auto hidden items-center lg:flex">
                <nav className="text-sm leading-6 font-semibold text-slate-700 dark:text-slate-200">
                  <ul className="flex list-none space-x-8">
                    <NavItems />
                  </ul>
                </nav>
              </div>
              <NavPopover className="-my-1 ml-auto" display="lg:hidden" />
            </div>
          </div>
          {hasNav && (
            <div className="flex items-center p-4 lg:hidden">
              <button
                type="button"
                onClick={() => onNavToggle(!navIsOpen)}
                className="text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300"
              >
                <span className="sr-only">Navigation</span>
                <svg width="24" height="24">
                  <path
                    d="M5 6h14M5 12h14M5 18h14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
