'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Info, Tag, User, FileText, Tags, HardDrive, Globe } from 'lucide-react';
import { useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { useMounted } from '@/hooks/useMounted';
import H1 from '@/components/H1';
import { DetailLayout } from '@/components/files/layout/DetailLayout';
import { DetailCard } from '@/components/files/layout/DetailCard';
import { DetailField } from '@/components/files/layout/DetailField';
import { Label } from '@/components/ui/label';
import { cn, getFileUrl, formatMimeType } from '@/utils/Utils';
import { FileSystem } from '@/utils/Types';
import { BlueskyIcon } from '@/components/icons/Bluesky';
import { DistributionCard } from '@/components/files/DistributionCard';

interface RecordData {
  id: string;
  atUri: string;
  label: string;
  summary: string;
  type: string;
  author: string;
  rkey: string;
  thumbnailUrl?: string;
  resource?: string; // The IIIF Manifest URL
  tags?: string[];
  metadata?: Record<string, string>;
  publishedAt?: string;
  handle?: string;
  cid?: string;
}

export default function ViewPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const isMounted = useMounted();
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<RecordData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fs, setFS] = useState<FileSystem>('GCS');

  useEffect(() => {
    if (!id || !isMounted) return;

    const fetchRecord = async () => {
      setLoading(true);
      try {
        const getRecordFn = httpsCallable(functions, 'appview-getRecord');
        // The id in the URL is the encoded AT URI
        const uri = decodeURIComponent(id as string);
        const response = await getRecordFn({ uri });
        const data = response.data as { record: RecordData };
        setRecord(data.record);
      } catch (err: any) {
        console.error('Fetch record error:', err);
        setError(err.message || 'Failed to load record');
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [id, isMounted]);

  if (!isMounted) return null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Spinner className="w-12 h-12 text-blue-600" />
        <p className="text-zinc-500 animate-pulse font-medium">{t('loading')}</p>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <div className="bg-red-50 dark:bg-red-900/20 p-8 rounded-3xl border border-red-100 dark:border-red-800 max-w-md">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">{t('fileNotFound')}</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-8">{error || 'The requested resource could not be found.'}</p>
          <Button asChild variant="outline">
            <Link href="/search">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Search
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const iiifManifestUrl = record.resource || '';
  const uvUrl = iiifManifestUrl ? `https://www.universalviewer.dev/#?iiifManifestId=${iiifManifestUrl}` : '';

  const header = (
    <header className="mb-12 flex flex-col items-start justify-between gap-4 xl:flex-row xl:items-center">
      <div className="space-y-1">
        <H1 variant="small" className="font-bold">{record.label}</H1>
        <div className="flex items-center gap-4 text-xs text-zinc-500 uppercase tracking-widest">
           <div className="flex items-center gap-2">
              <span>View Record</span>
           </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="sm" className="font-semibold">
          <Link href="/search">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Link>
        </Button>
      </div>
    </header>
  );

  const mainContent = (
    <>
      {/* General Info Card */}
      <DetailCard title="General Information" icon={FileText} size="lg">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <DetailField label="Label" value={record.label} className="md:col-span-2" />
          <DetailField label="Summary" value={record.summary} className="md:col-span-2" />
          <DetailField label="Type" value={record.type} />
        </div>
      </DetailCard>

      {/* Metadata & Tags Card */}
      <DetailCard title="Metadata & Tags" icon={Tags} size="lg">
        <div className="space-y-10">
          <div className="space-y-3">
            <Label className="text-zinc-600 dark:text-zinc-400">Tags</Label>
            {record.tags && record.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {record.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="px-3 py-1 text-xs font-semibold uppercase tracking-tight">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-zinc-400 italic font-medium">No tags</div>
            )}
          </div>

          <div className="space-y-6">
            <Label className="text-zinc-600 dark:text-zinc-400">Custom Metadata Fields</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {record.metadata && Object.keys(record.metadata).length > 0 ? (
                Object.entries(record.metadata).map(([key, value]) => (
                  <div key={key} className="flex flex-col space-y-1">
                    <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">{key}</span>
                    <span className="text-sm text-zinc-900 dark:text-zinc-100 font-medium">{value}</span>
                  </div>
                ))
              ) : (
                <div className="col-span-full flex items-center justify-center rounded-xl bg-zinc-50 py-10 dark:bg-zinc-900/30">
                   <p className="text-xs text-zinc-400 uppercase tracking-widest italic font-medium">No custom metadata</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DetailCard>
    </>
  );

  const sidebarContent = (
    <>
      {/* Preview Card */}
      <DetailCard title={t('preview')} icon={Info} size="md" className="!gap-6" headerAppend={
         <Badge variant="outline" className="uppercase tracking-tight opacity-70">
           {formatMimeType(record.type)}
         </Badge>
      }>
        <div className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 aspect-square">
          {record.thumbnailUrl ? (
            <>
              <img 
                src={record.thumbnailUrl} 
                alt={record.label} 
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 flex justify-center gap-4 bg-zinc-900/80 p-3 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 z-10">
                <a href={getFileUrl(fs, fs === 'IPFS' && record.cid ? record.cid : record.rkey, `regular.jpg`)} target="_blank" className="text-xs font-medium text-white hover:underline">{t('regular')}</a>
                <a href={getFileUrl(fs, fs === 'IPFS' && record.cid ? record.cid : record.rkey, `small.jpg`)} target="_blank" className="text-xs font-medium text-white hover:underline">{t('small')}</a>
              </div>
              {uvUrl && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-sm z-0">
                  <Button asChild size="lg" className="rounded-full shadow-2xl bg-white text-black hover:bg-zinc-100 border-none px-8 py-6 text-lg font-bold">
                    <a href={uvUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-2 h-6 w-6" />
                      {t('viewOnUVLink')}
                    </a>
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-4">
              <Info className="h-8 w-8 text-zinc-400" />
              <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">No Preview Available</p>
            </div>
          )}
        </div>
        
        {uvUrl && (
          <div className="block lg:hidden">
            <Button asChild variant="default" className="w-full font-semibold">
              <a href={uvUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                {t('viewOnUVLink')}
              </a>
            </Button>
          </div>
        )}
      </DetailCard>

      {/* Contributor Card */}
      <DetailCard title="Contributor" icon={User} size="md">
         <div className="flex items-start gap-4">
           <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
             <User className="w-5 h-5 text-zinc-500" />
           </div>
            <div className="overflow-hidden flex-grow">
              {record.handle && !record.handle.includes('mock') ? (
                <a 
                  href={`https://bsky.app/profile/${record.handle}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="font-bold text-zinc-900 dark:text-zinc-100 truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  @{record.handle}
                </a>
              ) : (
                <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {record.handle ? `@${record.handle}` : `@${record.author.split('.')[0]}`}
                </p>
              )}
              <p className="text-[10px] text-zinc-500 truncate font-mono mt-0.5">{record.author}</p>
            </div>
         </div>
      </DetailCard>

      <DistributionCard 
        fs={fs} 
        setFS={setFS} 
        id={record.id} 
        cid={record.cid || record.rkey} 
        type={record.type} 
        isProcessed={true} 
      />

      <DetailCard title="Bluesky / Matadisco" icon={BlueskyIcon} size="md">
        <div className="space-y-6">

          <div className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-zinc-500">AT Protocol URI</Label>
              <div className="mt-1 flex items-center gap-2 overflow-hidden">
                <code className="truncate text-[10px] text-zinc-500">{record.atUri}</code>
              </div>
            </div>
            <a 
              href={`https://atproto-browser.vercel.app/at/${record.author}/cx.vmx.matadisco/${record.rkey}`}
              target="_blank"
              className="flex w-full items-center justify-center rounded-lg bg-white py-2 text-xs font-medium border border-zinc-200 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              View on ATProto Browser
            </a>
          </div>
        </div>
      </DetailCard>
    </>
  );

  return (
    <DetailLayout 
      header={header}
      mainContent={mainContent}
      sidebarContent={sidebarContent}
    />
  );
}
