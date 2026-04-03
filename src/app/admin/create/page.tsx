import type { Metadata } from 'next';
import AuthCheck from '@/components/AuthCheck';
import { FileUploader } from '@/components/files/FileUploader';

export const metadata: Metadata = {
  title: 'NIIIFTY | Create File',
};

export default function CreateFilePage() {
  return (
    <AuthCheck
      signedInContent={
        <div>
          <FileUploader />
        </div>
      }
    />
  );
}
