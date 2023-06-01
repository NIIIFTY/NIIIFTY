import Link from "next/link";
import { useTranslation } from "react-i18next";

const UploadFilesButton = ({ href }: { href: string }) => {
  return <Large href={href} />;
};

const Large = ({ href }: { href: string }) => {
  const { t } = useTranslation();

  //transition-color flex cursor-pointer   lg:mx-0

  return (
    <Link href={href}>
      <a className="flex flex-row items-center justify-center rounded-md bg-black px-6 py-3 text-lg font-medium text-white no-underline shadow-md duration-500 hover:bg-white hover:text-black focus:outline-none dark:bg-white dark:text-black">
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="mr-2 h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
          {t("uploadFiles")}
        </>
      </a>
    </Link>
  );
};

const Small = ({ href }: { href: string }) => {
  const { t } = useTranslation();

  return (
    <Link href={href}>
      <a className="inline-flex items-center justify-center rounded-md border border-transparent bg-black py-2 pl-2 pr-4 text-sm font-medium text-white no-underline shadow-md duration-500 hover:bg-white hover:text-black focus:outline-none dark:bg-white dark:text-black sm:w-auto">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="mr-2 h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
        <>{t("uploadFiles")}</>
      </a>
    </Link>
  );
};

UploadFilesButton.Large = Large;
UploadFilesButton.Small = Small;

export default UploadFilesButton;
