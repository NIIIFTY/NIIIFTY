import { UserContext } from "@/utils/UserContext";
import { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { remove } from "@/hooks/useFile";
import { usePaginatedFiles } from "@/hooks/usePaginatedFiles";
import { getFileUrl } from "@/utils/Utils";
import Spinner from "@/components/Spinner";
import { useMounted } from "@/hooks/useMounted";
import { AuthoringFile } from "@/utils/Types";

export const FileList = ({
  onSelectFile,
}: {
  onSelectFile: (fileId: string) => void;
}) => {
  const { user, userAdapter } = useContext(UserContext);
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const [files, allFilesLoaded, loading] = usePaginatedFiles(
    user!,
    page,
    pageSize
  );

  const isMounted = useMounted();

  if (isMounted()) {
    return (
      <>
        {files.length > 0 && (
          <>
            <div className="mt-8 overflow-hidden shadow ring-1 ring-black ring-opacity-5 dark:ring-gray-600 md:mx-0 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                <thead className="bg-gray-100 dark:bg-gray-600">
                  <tr>
                    <th scope="col"></th>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100"
                    >
                      <>{t("title")}</>
                    </th>
                    <th
                      scope="col"
                      className="hidden px-12 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 lg:table-cell"
                    >
                      <>{t("type")}</>
                    </th>
                    <th
                      scope="col"
                      className="hidden px-12 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 xl:table-cell"
                    >
                      <>{t("modified")}</>
                    </th>
                    {/* <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">
                      <>{t("edit")}</>
                    </span>
                  </th> */}
                    <th
                      scope="col"
                      className="relative py-3.5 pl-3 pr-4 text-gray-900 sm:pr-6"
                    >
                      <span className="sr-only">
                        <>{t("delete")}</>
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {files.map((file: AuthoringFile) => (
                    <tr
                      key={file.id}
                      // className={cx(
                      //   !file.processed ? "pointer-events-none opacity-50" : ""
                      // )}
                    >
                      <td className="w-8 lg:w-32">
                        <button
                          className="block w-24 px-2 py-2 lg:w-32"
                          onClick={() => {
                            onSelectFile(file.id);
                          }}
                        >
                          <div className="bg-gray-500">
                            {file.processed ? (
                              <img
                                src={getFileUrl("GCS", file.id, "thumb.jpg")}
                                alt={file.title}
                              />
                            ) : (
                              <div className="flex h-20 w-24 content-center items-center justify-center text-white lg:h-28 lg:w-32">
                                <Spinner />
                              </div>
                            )}
                          </div>
                        </button>
                      </td>
                      <td className="max-w-[45vw] overflow-hidden text-ellipsis whitespace-nowrap py-4 pr-3 pl-4 text-sm font-medium text-gray-900">
                        {/* <a
                        href={`/${username}/${slugify(file.name)}`}
                        target="_blank"
                        className="text-blue-600 no-underline duration-500 hover:text-blue-900"
                      > */}
                        <button
                          className="no-underline"
                          onClick={() => {
                            onSelectFile(file.id);
                          }}
                        >
                          {file.title}
                        </button>
                        {/* </a> */}
                      </td>
                      <td className="hidden whitespace-nowrap px-12 py-4 text-sm text-gray-500 lg:table-cell">
                        {file.type.split("/")[1]}
                      </td>
                      <td className="hidden whitespace-nowrap px-12 py-4 text-sm text-gray-500 xl:table-cell">
                        {`${new Date(
                          // @ts-ignore
                          file.modified
                        ).toLocaleDateString()} | ${new Date(
                          // @ts-ignore
                          file.modified
                        ).toLocaleTimeString()}`}
                      </td>
                      {/* <td className="py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <button
                        onClick={() => {
                          window.location.href = `/admin/${file.id}`;
                        }}
                        className="text-blue-600 duration-500 hover:text-blue-900"
                      >
                        <>{t("details")}</>
                      </button>
                    </td> */}
                      <td className="py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                t("confirmFileDeletion", {
                                  title: file.title,
                                })
                              )
                            ) {
                              remove(userAdapter!, file.id);
                            }
                          }}
                          className="text-red-500 duration-500 hover:text-red-800 dark:text-red-500 dark:hover:text-red-300"
                        >
                          <>{t("delete")}</>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 w-full text-sm">
              {loading && <>{t("loading")}</>}
              {!loading && !allFilesLoaded && (
                <button
                  onClick={() => {
                    setPage(page + 1);
                  }}
                  className="text-blue-600 duration-500 hover:text-blue-900 dark:text-white dark:hover:text-gray-500"
                >
                  <>{t("showMore")}</>
                </button>
              )}
              {!loading && allFilesLoaded && <>{t("noMoreFiles")}</>}
            </div>
          </>
        )}
      </>
    );
  } else {
    return null;
  }
};
