import { useTranslation } from "react-i18next";
import Link from "./Link";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer>
      <div className="mt-16 flex flex-col items-center">
        <div className="mb-8 flex flex-col space-y-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 md:flex-row md:space-y-0 md:space-x-2">
          <div>{`© ${new Date().getFullYear()} ${t("mnemosceneLtd")}`}</div>
        </div>
      </div>
    </footer>
  );
}
