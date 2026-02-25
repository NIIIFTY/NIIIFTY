import type { Metadata } from 'next';
import AuthCheck from '@/components/AuthCheck';
import { EditFile } from '@/components/files/EditFile';

export const metadata: Metadata = {
  title: 'NIIIFTY | Edit File',
};

export default function EditFilePage({ params }: { params: { id: string } }) {
  const { id } = params;

  return <AuthCheck signedInContent={<EditFile id={id} />}></AuthCheck>;
}
