import { headerTitle } from "../utils/Config";
import Link from "./Link";
import SectionContainer from "./SectionContainer";
import Footer from "./Footer";
import MobileNav from "./MobileNav";
import ThemeSwitch from "./ThemeSwitch";
import { useTranslation } from "react-i18next";
import { useContext } from "react";
import { UserContext } from "@/utils/UserContext";
import { auth } from "@/utils/Firebase";
import router from "next/router";

const LayoutWrapper = ({ children }) => {
  const { username } = useContext(UserContext);

  const signOut = (e) => {
    e.preventDefault();
    auth.signOut();
    router.reload();
  };

  const { t } = useTranslation();
  return (
    <SectionContainer>
      <div className="flex h-screen flex-col justify-between">
        <header className="flex items-center justify-between py-10">
          <div>
            <Link href="/" aria-label={headerTitle}>
              <div className="flex items-center justify-between">
                <div className="mr-3 text-black dark:text-white">
                  {/* logo */}
                  <svg
                    width="50"
                    height="54"
                    viewBox="0 0 50 54"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="33.6455"
                      y="3.22137"
                      width="13.6014"
                      height="46.889"
                      rx="6.80069"
                      fill="url(#paint0_linear_309_11)"
                    />
                    <mask
                      id="mask0_309_11"
                      style={{
                        maskType: "alpha",
                      }}
                      maskUnits="userSpaceOnUse"
                      x="2"
                      y="3"
                      width="46"
                      height="48"
                    >
                      <path
                        d="M2.85559 10.0221C2.85559 6.26615 5.90037 3.22137 9.65629 3.22137V3.22137C13.4122 3.22137 16.457 6.26615 16.457 10.0221V43.3097C16.457 47.0656 13.4122 50.1104 9.65629 50.1104V50.1104C5.90037 50.1104 2.85559 47.0656 2.85559 43.3097V10.0221Z"
                        fill="black"
                      />
                      <path
                        d="M4.80881 15.3972C2.15298 12.5627 2.15298 7.96697 4.80882 5.13241V5.13241C7.46465 2.29786 11.7706 2.29786 14.4264 5.13241L45.1912 37.9674C47.847 40.802 47.847 45.3977 45.1912 48.2322V48.2322C42.5354 51.0668 38.2294 51.0668 35.5736 48.2322L4.80881 15.3972Z"
                        fill="black"
                      />
                    </mask>
                    <g mask="url(#mask0_309_11)">
                      <path
                        d="M55.8373 27.9186C55.8373 45.5121 41.5749 59.7745 23.9814 59.7745C6.38785 59.7745 -7.87451 45.5121 -7.87451 27.9186C-7.87451 10.3251 6.38785 -3.93726 23.9814 -3.93726C41.5749 -3.93726 55.8373 10.3251 55.8373 27.9186Z"
                        fill="url(#paint1_radial_309_11)"
                      />
                    </g>
                    <defs>
                      <linearGradient
                        id="paint0_linear_309_11"
                        x1="40.4462"
                        y1="3.22137"
                        x2="40.4462"
                        y2="50.1104"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#00FFE0" />
                        <stop offset="0.390625" stopColor="#0308FF" />
                        <stop offset="1" stopColor="#268EFC" />
                      </linearGradient>
                      <radialGradient
                        id="paint1_radial_309_11"
                        cx="0"
                        cy="0"
                        r="1"
                        gradientUnits="userSpaceOnUse"
                        gradientTransform="translate(9.10132 11.362) rotate(49.4672) scale(57.08)"
                      >
                        <stop stopColor="#E400FF" />
                        <stop offset="0.354167" stopColor="#CA28FF" />
                        <stop offset="0.895833" stopColor="#1CBAFD" />
                      </radialGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </Link>
          </div>
          <div className="flex items-center text-base leading-5">
            <div className="hidden sm:block">
              <Link
                href="/admin"
                className="p-1 font-medium text-gray-900 dark:text-gray-100 sm:p-4"
              >
                {t("myFiles")}
              </Link>
              <Link
                href="/docs"
                className="p-1 font-medium text-gray-900 dark:text-gray-100 sm:p-4"
              >
                {t("docs")}
              </Link>
              {username && (
                <a
                  onClick={signOut}
                  role="menuitem"
                  className="cursor-pointer p-1 font-medium text-gray-900 dark:text-gray-100 sm:p-4"
                >
                  <>{t("signOut")}</>
                </a>
              )}
            </div>
            <ThemeSwitch />
            <MobileNav />
          </div>
        </header>
        <main className="mb-auto">{children}</main>
        <Footer />
      </div>
    </SectionContainer>
  );
};

export default LayoutWrapper;
