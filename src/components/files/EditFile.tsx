'use client';

import { useState } from 'react';
import { useUserStore } from '@/store/user-store';
import { useTranslation } from 'react-i18next';
import { LoadingMessage } from '../LoadingMessage';
import { Spinner } from '@/components/ui/spinner';
import { remove, useAuthoringFile } from '@/hooks/useFile';
import { AuthoringFile, FileSystem, LicenseURL, MIMETYPES } from '@/utils/Types';
import { useMounted } from '@/hooks/useMounted';
import Alert from '../Alert';
import { getFileUrl, cn } from '@/utils/Utils';
import CopyText from '../CopyText';
import Tabs, { Tab } from '../Tabs';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Info, Globe, HardDrive, FileText, Tags, ExternalLink } from 'lucide-react';
import { BlueskyIcon } from '../icons/Bluesky';
import Section from '../Section';
import H1 from '../H1';

const fileSchema = z.object({
  label: z
    .string()
    .min(1, 'Label is required')
    .regex(/^[\w\-\s]+$/, 'Invalid title format (alphanumeric, dashes, spaces only)'),
  summary: z.string().default(''),
  provider: z.string().default(''),
  rights: z.string().default('https://creativecommons.org/publicdomain/zero/1.0/'),
  tags: z.array(z.string()).default(['iiif']),
  metadataEntries: z.array(z.object({
    key: z.string().min(1, 'Key is required'),
    value: z.string().min(1, 'Value is required')
  })).default([]),
});

interface FileFormData {
  label: string;
  summary: string;
  provider: string;
  rights: string;
  tags: string[];
  metadataEntries: { key: string; value: string; }[];
}

type PageErrorType = 'fileNotFound';

export type License = {
  label: string;
  value: LicenseURL;
};

const licenses: License[] = [
  {
    label: 'CC0 1.0 Universal (CC0 1.0) Public Domain Dedication',
    value: 'https://creativecommons.org/publicdomain/zero/1.0/',
  },
  {
    label: 'Attribution 4.0 International (CC BY 4.0)',
    value: 'https://creativecommons.org/licenses/by/4.0/',
  },
  {
    label: 'Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)',
    value: 'https://creativecommons.org/licenses/by-sa/4.0/',
  },
  {
    label: 'Attribution-NoDerivates 4.0 International (CC BY-ND 4.0)',
    value: 'https://creativecommons.org/licenses/by-nd/4.0/',
  },
  {
    label: 'Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)',
    value: 'https://creativecommons.org/licenses/by-nc/4.0/',
  },
  {
    label: 'Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)',
    value: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
  },
  {
    label: 'Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)',
    value: 'https://creativecommons.org/licenses/by-nc-nd/4.0/',
  },
  {
    label: 'Unsplash',
    value: 'https://unsplash.com/license',
  },
];

type TabName = 'GCS' | 'IPFS';

export function EditFile({ id }: { id: string }) {
  const { user, userAdapter } = useUserStore();
  const { t } = useTranslation();

  const [pageError, setPageError] = useState<PageErrorType>();
  const [cid, setCid] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [fs, setFS] = useState<FileSystem>('GCS');
  const [fsID, setFSID] = useState<string>(id);
  const [manifestId, setManifestId] = useState<string>('');
  const [ipnsName, setIpnsName] = useState<string>('');
  const [atDid, setAtDid] = useState<string>('');
  const [isProcessed, setIsProcessed] = useState<boolean>(false); // Default to false to avoid broken image flashes
  const [broadcasting, setIsBroadcasting] = useState<boolean>(false);

  const form = useForm<FileFormData>({
    resolver: zodResolver(fileSchema as any) as any,
    defaultValues: {
      label: '',
      summary: '',
      provider: '',
      rights: 'https://creativecommons.org/publicdomain/zero/1.0/',
      tags: ['iiif'],
      metadataEntries: [],
    },
  });

  const { handleSubmit, setValue, watch, control } = form;
  const { fields, append, remove: removeEntry } = useFieldArray({
    control,
    name: "metadataEntries",
  });

  const [_file, { update }] = useAuthoringFile(userAdapter!, id as string, {
    onData: (file) => {
      setValue('label', file.label);
      setValue('summary', file.summary || '');
      setValue('provider', file.provider || '');
      setValue('rights', file.rights);
      setValue('tags', Array.from(new Set(['iiif', ...(file.tags || [])])));
      
      // Map dictionary to entries for the form builder
      const entries = Object.entries(file.metadata || {}).map(([key, value]) => ({ key, value }));
      setValue('metadataEntries', entries);

      setCid(file.cid);
      setType(file.type);
      if (file.manifestId) {
        setManifestId(file.manifestId);
      }
      if (file.ipnsName) {
        setIpnsName(file.ipnsName);
      }
      if (file.atDid) {
        setAtDid(file.atDid);
      }
      setIsProcessed(!!file.processed);
      setIsBroadcasting(!!file.broadcasting);
    },
    onError: () => {
      setPageError('fileNotFound');
    },
  });

  const isMounted = useMounted();
  const label = watch('label') || '';

  const performSave = async (data: FileFormData, additionalFields: Partial<AuthoringFile> = {}) => {
    if (!update) return;

    // Convert entries back to dictionary
    const metadata: Record<string, string> = {};
    data.metadataEntries.forEach(entry => {
      metadata[entry.key] = entry.value;
    });

    await update(
      userAdapter!,
      id as string,
      {
        label: data.label,
        summary: data.summary,
        provider: data.provider,
        rights: data.rights as LicenseURL,
        tags: data.tags,
        metadata: metadata,
        ...additionalFields
      } as AuthoringFile,
    );
  };

  const onSubmit = async (data: FileFormData) => {
    await performSave(data);
    window.location.href = '/admin/';
  };

  const onPublishAtproto = async () => {
    // Validate form before publishing
    const isValid = await form.trigger();
    if (!isValid) return;
    
    await performSave(form.getValues(), { broadcasting: true });
  };

  if (user) {
    if (isMounted && pageError === 'fileNotFound') {
      return (
        <Alert>
          <>{t('fileNotFound')}</>
        </Alert>
      );
    }
    const Formats = () => {
      let tabs: Tab<TabName>[] = [
        {
          name: 'GCS',
          label: t('googleCloudStorage'),
        },
        {
          name: 'IPFS',
          label: t('ipfs'),
        },
      ];
      
      const jpg = getFileUrl(fs, fsID, `optimized.jpg`);
      const glb = getFileUrl(fs, fsID, `optimized.glb`);
      const mp4 = getFileUrl(fs, fsID, `optimized.mp4`);
      const dash = getFileUrl(fs, fsID, `dash/optimized.mpd`);
      const hls = getFileUrl(fs, fsID, `hls/optimized.m3u8`);
      const iiifManifest = getFileUrl(fs, fsID, `iiif/index.json`);

      return (
        <div className="space-y-8">
          {/* Header Card for Preview */}
          <div className="flex flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="flex items-center gap-3 text-zinc-500">
              <Info size={16} />
              <h3 className="text-sm font-semibold uppercase tracking-wider">{t('preview')}</h3>
            </div>
            <div className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
              {isProcessed ? (
                <>
                  <a href={getFileUrl(fs, fsID, `thumb.jpg`)} target="_blank" rel="noreferrer" className="block aspect-square w-full">
                    <img 
                      src={getFileUrl(fs, fsID, `thumb.jpg`)} 
                      alt={label} 
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </a>
                  <div className="absolute inset-x-0 bottom-0 flex justify-center gap-4 bg-zinc-900/80 p-3 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                    <a href={getFileUrl(fs, fsID, `regular.jpg`)} target="_blank" className="text-xs font-medium text-white hover:underline">{t('regular')}</a>
                    <a href={getFileUrl(fs, fsID, `small.jpg`)} target="_blank" className="text-xs font-medium text-white hover:underline">{t('small')}</a>
                  </div>
                </>
              ) : (
                <div className="flex aspect-square w-full flex-col items-center justify-center gap-4">
                  <Spinner className="h-8 w-8 text-zinc-400" />
                  <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">Generating Assets</p>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                 <Badge variant="outline" className="uppercase tracking-tight opacity-70">
                   {type.split('/')[1] || 'File'}
                 </Badge>
                 {fs === 'IPFS' && cid && (
                   <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                     <Globe size={10} />
                     Decentralized
                   </div>
                 )}
              </div>
            </div>
          </div>

          {/* Distribution & Technicals */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3 text-zinc-500">
                <HardDrive size={16} />
                <h3 className="text-sm font-semibold uppercase tracking-wider">Distribution</h3>
              </div>
            </div>

            <Tabs
              tabs={tabs.map((tab) => ({
                name: tab.name,
                label: tab.label,
                current: tab.name === fs,
              }))}
              onChange={(current: number) => {
                const name: FileSystem = tabs[current].name;
                setFS(name);
                setFSID(name === 'GCS' ? id : cid);
              }}
              disabled={!isProcessed}
            />

            <div className="mt-8 space-y-6">
              {(type === MIMETYPES.JPG || type === MIMETYPES.PNG || type === MIMETYPES.TIF || type === MIMETYPES.TIFF) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-zinc-500 uppercase tracking-tight">{t('JPG')}</Label>
                    {isProcessed && (
                      <a href={jpg} target="_blank" rel="noreferrer" className="text-zinc-400 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100">
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                  <CopyText id="jpg" text={jpg} disabled={!isProcessed} />
                </div>
              )}
              {type === MIMETYPES.GLB && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-zinc-500 uppercase tracking-tight">{t('glb')}</Label>
                  <CopyText id="glb" text={glb} disabled={!isProcessed} />
                </div>
              )}
              {type === MIMETYPES.MP4 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-zinc-500 uppercase tracking-tight">{t('mp4')}</Label>
                    <CopyText id="mp4" text={mp4} disabled={!isProcessed} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-zinc-500 uppercase tracking-tight">{t('dash')}</Label>
                    <CopyText id="dash" text={dash} disabled={!isProcessed} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-zinc-500 uppercase tracking-tight">{t('hls')}</Label>
                    <CopyText id="hls" text={hls} disabled={!isProcessed} />
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-zinc-500 uppercase tracking-tight">{t('iiifManifest')}</Label>
                  {isProcessed && (
                    <a href={`https://www.universalviewer.dev/#?iiifManifestId=${iiifManifest}`} target="_blank" rel="noreferrer" className="text-zinc-400 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100" title={t('viewOnUVLink')}>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                <CopyText id="iiif" text={iiifManifest} disabled={!isProcessed} />
              </div>
            </div>
          </div>

          {/* Federated Network Status */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="mb-6 flex flex-col gap-3">
              <div className="flex items-center gap-3 text-zinc-500">
                <BlueskyIcon size={16} />
                <h3 className="text-sm font-semibold uppercase tracking-wider">Bluesky / Matadisco</h3>
              </div>
              <p className="text-xs text-zinc-400">Publish this manifest to the federated network.</p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                {atDid ? (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-3 py-1">
                    Live
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-zinc-500/10 text-zinc-500 border-zinc-500/20 px-3 py-1">
                    Draft
                  </Badge>
                )}
                <Button 
                  type="button"
                  variant={atDid ? "outline" : "default"}
                  size="sm"
                  onClick={onPublishAtproto}
                  disabled={broadcasting || !isProcessed}
                  className="font-semibold"
                >
                  {broadcasting ? "Broadcasting..." : atDid ? "Update" : "Publish"}
                </Button>
              </div>

              {atDid && (
                <div className="mt-4 space-y-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
                  <div>
                    <Label className="text-[10px] uppercase tracking-wider text-zinc-500">AT Protocol URI</Label>
                    <div className="mt-1 flex items-center gap-2 overflow-hidden">
                      <code className="truncate text-[10px] text-zinc-500">at://{atDid}/cx.vmx.matadisco/{id}</code>
                    </div>
                  </div>
                  <a 
                    href={`https://atproto-browser.vercel.app/at/${atDid}/cx.vmx.matadisco/${id}`}
                    target="_blank"
                    className="flex w-full items-center justify-center rounded-lg bg-white py-2 text-xs font-medium border border-zinc-200 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                  >
                    View on Explorer
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    };

    return (
      <Section>
        <div className="relative w-full">


          <header className="mb-12 flex flex-col items-start justify-between gap-4 xl:flex-row xl:items-center">
            <div className="space-y-1">
              <H1 variant="small" className="font-bold">{label}</H1>
              <div className="flex items-center gap-4 text-xs text-zinc-500 uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <span>File ID:</span>
                  <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono normal-case tracking-normal dark:bg-zinc-800">{id}</code>
                </div>
                {!isProcessed && (
                  <div className="flex items-center gap-2 text-blue-500 font-bold animate-pulse">
                    <Spinner className="h-3 w-3" />
                    <span>Processing...</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={async () => {
                  if (window.confirm(t('confirmFileDeletion', { title: label }))) {
                    await remove(userAdapter!, id);
                    window.location.href = '/admin/';
                  }
                }}
                disabled={!isProcessed}
                className="font-semibold"
              >
                {t('delete')}
              </Button>
              <Button type="submit" form="edit-file-form" size="sm" disabled={!isProcessed} className="font-semibold">
                {t('update')}
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-12 xl:grid-cols-12">
            {/* Main Content Column */}
            <div className="xl:col-span-7">
              <Form {...form}>
                <form id="edit-file-form" onSubmit={handleSubmit(onSubmit) as any} className="space-y-12">
                  <fieldset disabled={!isProcessed} className="space-y-12">
                  {/* General Info Card */}
                  <div className="space-y-8 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-3 text-zinc-500">
                      <FileText size={16} />
                      <h3 className="text-sm font-semibold uppercase tracking-wider">General Information</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField<FileFormData>
                        control={control as any}
                        name="label"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel className="text-zinc-600 dark:text-zinc-400">Label <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value as string} placeholder="Enter label" className="ring-offset-background" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField<FileFormData>
                        control={control as any}
                        name="summary"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel className="text-zinc-600 dark:text-zinc-400">Summary</FormLabel>
                            <FormControl>
                              <Textarea {...field} value={field.value as string} placeholder="Enter summary" className="min-h-[120px]" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField<FileFormData>
                        control={control as any}
                        name="provider"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-600 dark:text-zinc-400">Provider</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value as string} placeholder="NIIIFTY" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField<FileFormData>
                        control={control as any}
                        name="rights"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel className="text-zinc-600 dark:text-zinc-400">Rights (License)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value as string} value={field.value as string}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a license" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {licenses.map((l) => (
                                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Metadata & Taxonomies Card */}
                  <div className="space-y-8 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-3 text-zinc-500">
                      <Tags size={16} />
                      <h3 className="text-sm font-semibold uppercase tracking-wider">Metadata & Tags</h3>
                    </div>
                    <div className="space-y-10">
                      <FormField<FileFormData>
                        control={control as any}
                        name="tags"
                        render={({ field }) => {
                          const tags = field.value as string[];
                          return (
                            <FormItem>
                              <FormLabel className="text-zinc-600 dark:text-zinc-400">Tags</FormLabel>
                              <div className="space-y-4">
                                <Input
                                  placeholder="Type and press enter to add tags"
                                  disabled={!isProcessed}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const input = e.target as HTMLInputElement;
                                      const value = input.value.trim();
                                      if (value && !tags.includes(value)) {
                                        field.onChange([...tags, value]);
                                        input.value = '';
                                      }
                                    }
                                  }}
                                />
                                <div className="flex flex-wrap gap-2">
                                  {tags.map((tag) => (
                                    <Badge
                                      key={tag}
                                      variant={tag === 'iiif' ? 'secondary' : 'default'}
                                      className={cn(
                                        "flex items-center gap-1.5 px-3 py-1 text-xs font-semibold uppercase tracking-tight transition-colors",
                                        (tag === 'iiif' || !isProcessed) && "opacity-50 cursor-not-allowed" 
                                      )}
                                    >
                                      {tag}
                                      {tag !== 'iiif' && (
                                        <X 
                                          size={12} 
                                          className={cn("cursor-pointer hover:text-red-500", !isProcessed && "pointer-events-none")} 
                                          onClick={() => {
                                            if (isProcessed) {
                                              field.onChange(tags.filter((t) => t !== tag));
                                            }
                                          }} 
                                        />
                                      )}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />

                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <Label className="text-zinc-600 dark:text-zinc-400">Custom Metadata Fields</Label>
                          <Button type="button" variant="outline" size="sm" onClick={() => append({ key: '', value: '' })} className="h-8">
                            <Plus size={14} className="mr-2" />
                            Add Field
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          {fields.map((field, index) => (
                            <div key={field.id} className="flex gap-3">
                              <div className="flex-1">
                                <Input {...form.register(`metadataEntries.${index}.key` as const)} placeholder="Key" className="bg-zinc-50 dark:bg-transparent" />
                              </div>
                              <div className="flex-1">
                                <Input {...form.register(`metadataEntries.${index}.value` as const)} placeholder="Value" className="bg-zinc-50 dark:bg-transparent" />
                              </div>
                              <Button type="button" variant="ghost" size="icon" onClick={() => removeEntry(index)} className="h-10 w-10 text-zinc-400 hover:text-red-500">
                                <X size={16} />
                              </Button>
                            </div>
                          ))}
                          {fields.length === 0 && (
                            <div className="flex items-center justify-center rounded-xl bg-zinc-50 py-10 dark:bg-zinc-900/30">
                               <p className="text-xs text-zinc-400 uppercase tracking-widest italic font-medium">No custom metadata</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  </fieldset>
                </form>
              </Form>
            </div>

            {/* Sidebar Column */}
            <aside className="xl:col-span-5 space-y-8">
              <Formats />
            </aside>
          </div>
        </div>
      </Section>
    );
  } else {
    return <LoadingMessage />;
  }
}
