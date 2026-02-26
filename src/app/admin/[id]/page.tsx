import type { Metadata } from 'next';
import AuthCheck from '@/components/AuthCheck';
import { EditFile } from '@/components/files/EditFile';

export const metadata: Metadata = {
  title: 'NIIIFTY | Edit File',
};

export default async function EditFilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <AuthCheck signedInContent={<EditFile id={id} />}></AuthCheck>;
}
