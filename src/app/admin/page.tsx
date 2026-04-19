'use client';

import AuthCheck from '@/components/AuthCheck';
import { FileList } from '@/components/files/FileList';
import UploadFilesButton from '@/components/files/UploadFilesButton';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';

export default function AdminPage(_props: any) {
  return <AuthCheck signedInContent={<Admin />}></AuthCheck>;
}

function Admin() {
  const { t } = useTranslation();

  return (
    <div className="relative py-8">
      <div className="w-full">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold">
              <>{t('files')}</>
            </h1>
          </div>
          <div className="mt-6 sm:mt-0 sm:ml-16 sm:flex-none">
            <UploadFilesButton.Small href="/admin/create" />
          </div>
        </div>
        <FileList
          onSelectFile={(fileId: string) => {
            window.location.href = `/admin/${fileId}`;
          }}
        />
      </div>
    </div>
  );
}
