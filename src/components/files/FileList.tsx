import { useUserStore } from '@/store/user-store';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { remove } from '@/hooks/useFile';
import { usePaginatedFiles } from '@/hooks/usePaginatedFiles';
import { getFileUrl } from '@/utils/Utils';
import { Spinner } from '@/components/ui/spinner';
import { useMounted } from '@/hooks/useMounted';
import { AuthoringFile } from '@/utils/Types';
import UploadFilesButton from '@/components/files/UploadFilesButton';


export const FileList = ({ onSelectFile }: { onSelectFile: (fileId: string) => void }) => {
  const { user, userAdapter } = useUserStore();
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const [files, allFilesLoaded, loading] = usePaginatedFiles(user!, page, pageSize);

  const isMounted = useMounted();

  if (isMounted) {
    return (
      <>
        {files.length > 0 && (
          <>
            <div className="mt-8 overflow-hidden shadow ring-1 ring-zinc-200 md:mx-0 md:rounded-lg dark:ring-zinc-800">
              <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                <thead className="bg-zinc-100 dark:bg-zinc-900">
                  <tr>
                    <th
                      scope="col"
                      className="w-16 py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100 lg:w-32"
                    >
                      {/* Thumbnail column */}
                    </th>
                    <th
                      scope="col"
                      className="py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                    >
                      <>{t('title')}</>
                    </th>
                    <th
                      scope="col"
                      className="hidden px-6 py-3.5 text-left text-sm font-semibold text-zinc-900 lg:table-cell dark:text-zinc-100"
                    >
                      <>{t('type')}</>
                    </th>
                    <th
                      scope="col"
                      className="hidden px-6 py-3.5 text-left text-sm font-semibold text-zinc-900 xl:table-cell dark:text-zinc-100"
                    >
                      <>{t('modified')}</>
                    </th>
                    <th scope="col" className="relative py-3.5 pr-4 pl-3 text-zinc-900 sm:pr-6">
                      <span className="sr-only">
                        <>{t('actions')}</>
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-transparent">
                  {files.map((file: AuthoringFile) => (
                    <tr
                      key={file.id}
                      className="group cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                      onClick={() => onSelectFile(file.id!)}
                    >
                      <td className="w-16 py-4 pr-3 pl-4 lg:w-32">
                        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 lg:h-20 lg:w-24">
                          {file.processed ? (
                            <img
                              src={getFileUrl('GCS', file.id!, 'thumb.jpg')}
                              alt={file.label}
                              className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex items-center justify-center text-zinc-500">
                              <Spinner />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="max-w-[45vw] overflow-hidden py-4 pr-3 pl-4 text-sm font-medium text-ellipsis whitespace-nowrap text-zinc-900 dark:text-zinc-100">
                        <div className="flex flex-col">
                          <span className="font-semibold">{file.label}</span>
                          <span className="text-xs text-zinc-500 lg:hidden">
                            {file.type.split('/')[1]} • {new Date(file.modified as any).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="hidden px-6 py-4 text-sm whitespace-nowrap text-zinc-500 lg:table-cell uppercase tracking-tight">
                        {file.type.split('/')[1]}
                      </td>
                      <td className="hidden px-6 py-4 text-sm whitespace-nowrap text-zinc-500 xl:table-cell">
                        <div className="flex flex-col">
                          <span>{new Date(file.modified as any).toLocaleDateString()}</span>
                          <span className="text-xs opacity-60">
                            {new Date(file.modified as any).toLocaleTimeString()}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 pr-4 pl-3 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row click
                            if (
                              window.confirm(
                                t('confirmFileDeletion', {
                                  title: file.label,
                                }),
                              )
                            ) {
                              remove(userAdapter!, file.id!);
                            }
                          }}
                          className="rounded-md px-2 py-1 text-zinc-400 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100"
                        >
                          <>{t('delete')}</>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 w-full text-sm">
              {loading && <>{t('loading')}</>}
              {!loading && !allFilesLoaded && (
                <button
                  onClick={() => {
                    setPage(page + 1);
                  }}
                  className="text-blue-600 duration-500 hover:text-blue-900 dark:text-white dark:hover:text-gray-500"
                >
                  <>{t('showMore')}</>
                </button>
              )}
              {!loading && allFilesLoaded && <>{t('noMoreFiles')}</>}
            </div>
          </>
        )}
        {files.length === 0 && !loading && (
          <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 py-20 text-center dark:border-zinc-800">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-50 dark:bg-zinc-900">
              <svg 
                className="h-8 w-8 text-zinc-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" 
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {t('noFilesYet') || 'No files uploaded'}
            </h3>
            <p className="mt-2 text-sm text-zinc-500">
              {t('getStartedByUploading') || 'Get started by uploading your first IIIF asset.'}
            </p>
            <div className="mt-8">
              <UploadFilesButton.Small href="/admin/create" />
            </div>
          </div>
        )}
        {loading && files.length === 0 && (
          <div className="mt-20 flex justify-center">
            <Spinner className="h-8 w-8" />
          </div>
        )}
      </>
    );
  } else {
    return null;
  }
};
