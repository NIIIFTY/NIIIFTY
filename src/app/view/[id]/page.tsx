'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Share2, Info, Tag, User } from 'lucide-react';
import { useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { useMounted } from '@/hooks/useMounted';

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
}

export default function ViewPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const isMounted = useMounted();
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<RecordData | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header / Navigation */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <nav className="flex items-center justify-between mb-8">
          <Button asChild variant="ghost" className="hover:bg-zinc-100 dark:hover:bg-zinc-900">
            <Link href="/search">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Search
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="rounded-full">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <a href={iiifManifestUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Raw Manifest
              </a>
            </Button>
          </div>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Preview & Description */}
          <div className="lg:col-span-8 space-y-6">
            <div className="aspect-video bg-zinc-50 dark:bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl relative group">
              {record.thumbnailUrl ? (
                <img
                  src={record.thumbnailUrl}
                  alt={record.label}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6">
                    <Info className="w-10 h-10 text-zinc-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">No Preview Available</h3>
                </div>
              )}
              
              {/* Overlay for Desktop */}
              {uvUrl && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-sm">
                  <Button asChild size="lg" className="rounded-full shadow-2xl bg-white text-black hover:bg-zinc-100 border-none px-8 py-6 text-lg font-bold">
                    <a href={uvUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-2 h-6 w-6" />
                      {t('viewOnUVLink')}
                    </a>
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile/Secondary Action */}
            {uvUrl && (
              <div className="block lg:hidden">
                <Button asChild variant="default" className="w-full py-8 rounded-3xl text-xl font-black shadow-xl">
                  <a href={uvUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-3 h-6 w-6" />
                    {t('viewOnUVLink')}
                  </a>
                </Button>
              </div>
            )}

            <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl p-8 border border-zinc-100 dark:border-zinc-800">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-500" />
                Description
              </h2>
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-lg">
                {record.summary || 'No description provided for this resource.'}
              </p>
            </div>
          </div>

          {/* Right Column: Metadata */}
          <div className="lg:col-span-4 space-y-8">
            <div className="space-y-4">
              <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 px-4 py-1 uppercase tracking-widest text-[10px] font-black">
                {record.type}
              </Badge>
              <h1 className="text-4xl font-black tracking-tight dark:text-white leading-tight">
                {record.label}
              </h1>
            </div>

            {/* Primary Desktop Action */}
            {uvUrl && (
              <div className="hidden lg:block">
                <Button asChild variant="default" className="w-full py-8 rounded-3xl text-xl font-black shadow-xl hover:scale-[1.02] transition-transform">
                  <a href={uvUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-3 h-6 w-6" />
                    {t('viewOnUVLink')}
                  </a>
                </Button>
              </div>
            )}

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-zinc-500" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Contributor</p>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">@{record.author.split('.')[0]}</p>
                  <p className="text-xs text-zinc-500 truncate max-w-[200px]">{record.author}</p>
                </div>
              </div>

              {record.tags && record.tags.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-2">
                    <Tag className="w-3 h-3" />
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {record.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 transition-colors">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {record.metadata && Object.keys(record.metadata).length > 0 && (
              <div className="pt-8 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Technical Details</h3>
                <div className="space-y-4">
                  {Object.entries(record.metadata).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-3 gap-2">
                      <span className="text-xs font-medium text-zinc-400 capitalize">{key}</span>
                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 col-span-2 break-words">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-8 border-t border-zinc-100 dark:border-zinc-800">
              <div className="p-6 bg-zinc-900 rounded-3xl text-white space-y-4 shadow-xl">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">AT Protocol Identifier</p>
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <code className="text-[10px] break-all text-blue-400">{record.atUri}</code>
                </div>
                <Button asChild variant="link" className="text-blue-400 p-0 h-auto text-xs">
                  <a href={`https://atproto-browser.vercel.app/at/${record.author}/cx.vmx.matadisco/${record.rkey}`} target="_blank" rel="noreferrer">
                    View on AT Protocol Explorer →
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
