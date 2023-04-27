import AuthCheck from "@/components/AuthCheck";
import { UserContext } from "@/utils/UserContext";
import { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { remove } from "@/hooks/useFile";
import { usePaginatedFiles } from "@/hooks/usePaginatedFiles";
import UploadFilesButton from "@/components/UploadFilesButton";
import { getFileUrl } from "@/utils/Utils";
import cx from "classnames";
import Spinner from "@/components/Spinner";

export default function AdminPage(_props) {
  return <AuthCheck signedInContent={<Admin />}></AuthCheck>;
}

function Admin() {
  return <FileList />;
}

const FileList = () => {
  const { user, userAdapter } = useContext(UserContext);
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const [files, allFilesLoaded, loading] = usePaginatedFiles(
    user,
    page,
    pageSize
  );

  return (
    <div className="w-full">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold">
            <>{t("myFiles")}</>
          </h1>
          {files.length === 0 && (
            <p className="mt-2 text-sm">
              <>{t("noFilesFound")}</>
            </p>
          )}
        </div>
        <div className="mt-6 sm:mt-0 sm:ml-16 sm:flex-none">
          <UploadFilesButton.Small href="/admin/create" />
        </div>
      </div>
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
                    className="hidden px-12 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 lg:table-cell"
                  >
                    <>{t("modified")}</>
                  </th>
                  {/* <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">
                      <>{t("edit")}</>
                    </span>
                  </th> */}
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">
                      <>{t("delete")}</>
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {files.map((file: any) => (
                  <tr
                    key={file.id}
                    className={cx(
                      !file.processed ? "pointer-events-none opacity-50" : ""
                    )}
                  >
                    <td className="w-8">
                      <a
                        className="block w-24 px-2 py-2"
                        href={`/admin/${file.id}`}
                      >
                        <div className="bg-gray-400">
                          {file.processed ? (
                            <img
                              src={getFileUrl("GCS", file.id, "thumb.jpg")}
                              alt={file.title}
                            />
                          ) : (
                            <div className="flex h-20 w-20 content-center items-center justify-center pl-4">
                              <Spinner />
                            </div>
                          )}
                        </div>
                      </a>
                    </td>
                    <td className="max-w-[45vw] overflow-hidden text-ellipsis whitespace-nowrap py-4 pr-3 pl-4 text-sm font-medium text-gray-900">
                      {/* <a
                        href={`/${username}/${slugify(file.name)}`}
                        target="_blank"
                        className="text-blue-600 no-underline duration-500 hover:text-blue-900"
                      > */}
                      <a className="no-underline" href={`/admin/${file.id}`}>
                        {file.title}
                      </a>
                      {/* </a> */}
                    </td>
                    <td className="hidden whitespace-nowrap px-12 py-4 text-sm text-gray-400 lg:table-cell">
                      {file.type.split("/")[1]}
                    </td>
                    <td className="hidden whitespace-nowrap px-12 py-4 text-sm text-gray-400 lg:table-cell">
                      {`${new Date(
                        file.modified
                      ).toLocaleDateString()} | ${new Date(
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
                            remove(userAdapter, file.id);
                          }
                        }}
                        className="text-blue-600 duration-500 hover:text-blue-900 dark:text-white dark:hover:text-gray-400"
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
                className="text-blue-600 duration-500 hover:text-blue-900 dark:text-white dark:hover:text-gray-400"
              >
                <>{t("showMore")}</>
              </button>
            )}
            {!loading && allFilesLoaded && <>{t("noMoreFiles")}</>}
          </div>
        </>
      )}
    </div>
  );
};
