import { useContext, FormEvent, useState } from "react";
import { UserContext } from "@/utils/UserContext";
import Metatags from "@/components/Metatags";
import { useTranslation } from "react-i18next";
import { LoadingMessage } from "../LoadingMessage";
import { remove, useAuthoringFile } from "@/hooks/useFile";
import {
  AuthoringFile,
  FileSystem,
  LicenseURL,
  MIMETYPES,
} from "@/utils/Types";
import { useMounted } from "@/hooks/useMounted";
import Alert from "../Alert";
import { getFileUrl } from "@/utils/Utils";
import { ErrorMessage } from "../ErrorMessage";
import cx from "classnames";
import CopyText from "../CopyText";
import Tabs, { Tab } from "../Tabs";

type PageErrorType = "fileNotFound";

type FormErrorType = "title";

type FormErrors = {
  [key in FormErrorType]?: boolean;
};

export type License = {
  label: string;
  value: LicenseURL;
};

const licenses: License[] = [
  {
    label: "CC0 1.0 Universal (CC0 1.0) Public Domain Dedication",
    value: "https://creativecommons.org/publicdomain/zero/1.0/",
  },
  {
    label: "Attribution 4.0 International (CC BY 4.0)",
    value: "https://creativecommons.org/licenses/by/4.0/",
  },
  {
    label: "Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)",
    value: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  {
    label: "Attribution-NoDerivates 4.0 International (CC BY-ND 4.0)",
    value: "https://creativecommons.org/licenses/by-nd/4.0/",
  },
  {
    label: "Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)",
    value: "https://creativecommons.org/licenses/by-nc/4.0/",
  },
  {
    label:
      "Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)",
    value: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
  },
  {
    label:
      "Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)",
    value: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
  },
  {
    label: "Unsplash",
    value: "https://unsplash.com/license",
  },
];

type TabName = "GCS" | "IPFS";

export function EditFile({ id }: { id: string }) {
  const { user, userAdapter } = useContext(UserContext);
  const { t } = useTranslation();

  const [pageError, setPageError] = useState<PageErrorType>();
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [attribution, setAttribution] = useState<string>("");
  const [license, setLicense] = useState<LicenseURL>();
  const [cid, setCid] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [fs, setFS] = useState<FileSystem>("GCS");
  const [fsID, setFSID] = useState<string>(id);

  const [_file, { update }] = useAuthoringFile(userAdapter!, id as string, {
    onData: (file) => {
      setTitle(file.title);
      setDescription(file.description || "");
      setAttribution(file.attribution || "");
      setLicense(file.license);
      setCid(file.cid);
      setType(file.type);
    },
    onError: () => {
      setPageError("fileNotFound");
    },
  });

  const isMounted = useMounted();

  const handleValidation = () => {
    let tempErrors: FormErrors = {};
    let isValid = true;

    // https://stackoverflow.com/a/13283557
    const titleRegex = /^[\w\-\s]+$/;

    if (!titleRegex.test(title)) {
      tempErrors["title"] = true;
      isValid = false;
    }

    setFormErrors({ ...tempErrors });
    return isValid;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    let isValidForm = handleValidation();

    if (isValidForm) {
      await update!(
        userAdapter!,
        id as string,
        {
          title,
          description,
          attribution,
          license,
        } as AuthoringFile
      );

      window.location.href = "/admin/";
    }
  };

  if (user) {
    if (isMounted() && pageError === "fileNotFound") {
      return (
        <>
          <Alert>
            <>{t("fileNotFound")}</>
          </Alert>
        </>
      );
    }

    const Formats = () => {
      let tabs: Tab<TabName>[] = [
        {
          name: "GCS",
          label: t("googleCloudStorage"),
        },
        {
          name: "IPFS",
          label: t("ipfs"),
        },
      ];

      const dash: string = getFileUrl(fs, fsID, `dash/optimized.mpd`);
      const glb: string = getFileUrl(fs, fsID, `optimized.glb`);
      const hls: string = getFileUrl(fs, fsID, `hls/optimized.m3u8`);
      const iiifManifest: string = getFileUrl(fs, fsID, `iiif/index.json`);
      const jpg: string = getFileUrl(fs, fsID, `optimized.jpg`);
      const mp4: string = getFileUrl(fs, fsID, `optimized.mp4`);

      return (
        <>
          <div className="pt-8">
            <Tabs
              tabs={tabs.map((tab, _index) => {
                return {
                  name: tab.name,
                  label: tab.label,
                  current: tab.name === fs,
                };
              })}
              onChange={(current: number) => {
                const name: FileSystem = tabs[current].name;
                setFS(name);
                setFSID(name === "GCS" ? id : cid);
              }}
            />
          </div>
          {/* thumbnail */}
          <label className="mt-8 font-light text-gray-600 dark:text-white">
            <>{t("thumbnail")}</>
          </label>
          <div className="w-64">
            <a href={getFileUrl(fs, fsID, `thumb.jpg`)} target="_blank">
              <img src={getFileUrl(fs, fsID, `thumb.jpg`)} alt={title} />
            </a>
            <a href={getFileUrl(fs, fsID, `regular.jpg`)} target="_blank">
              {t("regular")}
            </a>
            <br />
            <a href={getFileUrl(fs, fsID, `small.jpg`)} target="_blank">
              {t("small")}
            </a>
          </div>
          {(type === MIMETYPES.JPG ||
            type === MIMETYPES.PNG ||
            type === MIMETYPES.TIF ||
            type === MIMETYPES.TIFF) && (
            <>
              {/* jpg */}
              <label
                htmlFor="jpg"
                className="mt-8 font-light text-gray-600 dark:text-white"
              >
                <>{t("JPG")}</>
              </label>

              <div>
                <CopyText id="jpg" text={jpg} />
              </div>

              <a href={jpg} target="_blank">
                {t("view")}
              </a>
            </>
          )}
          {type === MIMETYPES.GLB && (
            <>
              {/* glb */}
              <label
                htmlFor="glb"
                className="mt-8 font-light text-gray-600 dark:text-white"
              >
                <>{t("glb")}</>
              </label>

              <div>
                <CopyText id="glb" text={glb} />
              </div>

              <a
                href={`https://view-gltf.glitch.me?gltf=${glb}`}
                target="_blank"
              >
                {t("view")}
              </a>
            </>
          )}
          {type === MIMETYPES.MP4 && (
            <>
              {/* mp4 */}
              <label
                htmlFor="mp4"
                className="mt-8 font-light text-gray-600 dark:text-white"
              >
                <>{t("mp4")}</>
              </label>

              <div>
                <CopyText id="mp4" text={mp4} />
              </div>

              <a href={`${mp4}`} target="_blank">
                {t("view")}
              </a>

              {/* dash */}
              <label
                htmlFor="dash"
                className="mt-8 font-light text-gray-600 dark:text-white"
              >
                <>{t("dash")}</>
              </label>

              <div>
                <CopyText id="dash" text={dash} />
              </div>

              {/* <a
                href={`https://reference.dashif.org/dash.js/nightly/samples/dash-if-reference-player/index.html?mpd=${encodeURIComponent(
                  dash
                )}+&debug.logLevel=4&streaming.delay.liveDelayFragmentCount=NaN&streaming.delay.liveDelay=NaN&streaming.buffer.initialBufferLevel=NaN&streaming.liveCatchup.maxDrift=NaN&streaming.liveCatchup.playbackRate.min=NaN&streaming.liveCatchup.playbackRate.max=NaN`}
                target="_blank"
              >
                {t("view")}
              </a> */}

              <a
                href={`https://players.akamai.com/players/dashjs?streamUrl=${encodeURIComponent(
                  dash
                )}`}
                target="_blank"
              >
                {t("view")}
              </a>

              {/* hls */}
              <label
                htmlFor="hls"
                className="mt-8 font-light text-gray-600 dark:text-white"
              >
                <>{t("hls")}</>
              </label>

              <div>
                <CopyText id="hls" text={hls} />
              </div>

              <a
                href={`https://players.akamai.com/players/hlsjs?streamUrl=${hls}`}
                target="_blank"
              >
                {t("view")}
              </a>
            </>
          )}

          {/* iiif */}
          <label
            htmlFor="iiif"
            className="mt-8 font-light text-gray-600 dark:text-white"
          >
            <>{t("iiifManifest")}</>
          </label>

          <div>
            <CopyText id="iiif" text={iiifManifest} />
            <a
              href={`https://www.universalviewer.dev/#?iiifManifestId=${iiifManifest}`}
              target="_blank"
              title={t("viewOnUVLink")}
            >
              {t("view")}
            </a>
          </div>
        </>
      );
    };

    return (
      <>
        <Metatags
          title={`NIIIFTY | ${title} (edit)`}
          description={description}
        />
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* title */}
          <label
            htmlFor="title"
            className="mt-8 font-light text-gray-600 dark:text-white"
          >
            <>{t("title")}</>
            <span className="mt-1 ml-1 text-sm text-red-700">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
            }}
            name="title"
            maxLength={200}
            className="border-b border-gray-300 bg-transparent py-2 pl-4 font-light text-gray-600 ring-blue-500 focus:outline-none focus:ring-1 dark:border-gray-500 dark:text-white"
          />
          {formErrors?.title && (
            <ErrorMessage>
              <>{t("titleInvalid")}</>
            </ErrorMessage>
          )}
          {/* attribution */}
          <label
            htmlFor="attribution"
            className="mt-8 font-light text-gray-600 dark:text-white"
          >
            <>{t("attribution")}</>
          </label>
          <input
            type="text"
            value={attribution}
            onChange={(e) => {
              setAttribution(e.target.value);
            }}
            name="attribution"
            maxLength={200}
            className="border-b border-gray-300 bg-transparent py-2 pl-4 font-light text-gray-600 ring-blue-500 focus:outline-none focus:ring-1 dark:border-gray-500 dark:text-white"
          />
          {/* license */}
          <label
            htmlFor="license"
            className="mt-8 font-light text-gray-600 dark:text-white"
          >
            <>{t("license")}</>
          </label>
          <select
            value={license}
            className="block w-full border-gray-300 py-2 pl-3 pr-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-500 dark:bg-black dark:text-white"
            onChange={(event: React.FormEvent<HTMLSelectElement>) => {
              setLicense(event.currentTarget.value as LicenseURL);
            }}
          >
            {licenses.map((l: License, index: number) => {
              const { label, value } = l;
              return (
                <option key={index} value={value} className="">
                  {label}
                </option>
              );
            })}
          </select>

          {/* ipfs */}
          {/* <label
            htmlFor="cid"
            className="mt-8 font-light text-gray-600 dark:text-white"
          >
            <>{t("ipfs")}</>
          </label>

          <div>
            <CopyText id="cid" text={cid} />
            <a
              href={`https://${cid}.ipfs.w3s.link`}
              target="_blank"
              title={t("viewOnW3SLink")}
            >
              {t("view")}
            </a>
          </div> */}

          <Formats />

          <div className="flex flex-row items-center justify-start">
            <button
              type="submit"
              className={cx(
                "transition-color mt-8 flex flex-row items-center rounded-md bg-black px-6 py-3 text-lg font-medium text-white shadow-md duration-500 hover:bg-white hover:text-black focus:outline-none dark:bg-white dark:text-black dark:hover:text-gray-500"
              )}
            >
              <>{t("update")}</>
            </button>
            <button
              type="button"
              onClick={async () => {
                if (
                  window.confirm(
                    t("confirmFileDeletion", {
                      title: title,
                    })
                  )
                ) {
                  await remove(userAdapter, id);
                  window.location.href = "/admin/";
                }
              }}
              className={cx(
                "transition-color  mt-8 ml-auto flex flex-row items-center rounded-md bg-gray-200 px-6 py-3 text-lg font-medium text-red-500 shadow-md duration-500 hover:bg-white hover:text-red-800 focus:outline-none dark:bg-gray-200 dark:text-red-500 dark:hover:text-red-900"
              )}
            >
              <>{t("delete")}</>
            </button>
          </div>
        </form>
      </>
    );
  } else {
    return <LoadingMessage />;
  }
}
