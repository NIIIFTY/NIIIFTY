import type { Metadata } from 'next';
import AuthCheck from '@/components/AuthCheck';
import { FileUploader } from '@/components/files/FileUploader';
import Section from '@/components/Section';
import H1 from '@/components/H1';

export const metadata: Metadata = {
  title: 'NIIIFTY | Upload Files',
};

export default function CreateFilePage() {
  return (
    <AuthCheck
      signedInContent={
        <Section>
          <div className="w-full">
             <div className="mb-12 border-b border-zinc-200 pb-8 dark:border-zinc-800">
               <H1 variant="small">Upload Files</H1>
               <p className="mt-2 text-sm text-zinc-500">Drag and drop files to add them to your NIIIFTY library.</p>
             </div>
             <FileUploader />
          </div>
        </Section>
      }
    />
  );
}
