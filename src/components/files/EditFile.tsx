'use client';

import { useState } from 'react';
import { useUserStore } from '@/store/user-store';
import { useTranslation } from 'react-i18next';
import { LoadingMessage } from '../LoadingMessage';
import Spinner from '../Spinner';
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
import { X, Plus } from 'lucide-react';

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
  const [isProcessed, setIsProcessed] = useState<boolean>(true); // Default to true to avoid flash
  const [isPublishRequested, setIsPublishRequested] = useState<boolean>(false);

  const form = useForm<FileFormData>({
    resolver: zodResolver(fileSchema) as any,
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
      setIsPublishRequested(!!file.atprotoPublishRequested);
    },
    onError: () => {
      setPageError('fileNotFound');
    },
  });

  const isMounted = useMounted();
  const label = watch('label') || '';

  const onSubmit = async (data: FileFormData) => {
    // Convert entries back to dictionary
    const metadata: Record<string, string> = {};
    data.metadataEntries.forEach(entry => {
      metadata[entry.key] = entry.value;
    });

    await update!(
      userAdapter!,
      id as string,
      {
        label: data.label,
        summary: data.summary,
        provider: data.provider,
        rights: data.rights as LicenseURL,
        tags: data.tags,
        metadata: metadata,
      } as AuthoringFile,
    );
    window.location.href = '/admin/';
  };

  const onPublishAtproto = async () => {
    if (!update) return;
    
    // Trigger the manual publish flag in Firestore
    await update(
      userAdapter!,
      id as string,
      {
        atprotoPublishRequested: true
      } as AuthoringFile
    );
    // The UI will re-render via useAuthoringFile listener and show "Broadcasting..."
  };

  if (user) {
    if (isMounted() && pageError === 'fileNotFound') {
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

      const dash: string = getFileUrl(fs, fsID, `dash/optimized.mpd`, ipnsName);
      const glb: string = getFileUrl(fs, fsID, `optimized.glb`, ipnsName);
      const hls: string = getFileUrl(fs, fsID, `hls/optimized.m3u8`, ipnsName);
      const iiifManifest: string =
        fs === 'IPFS' && manifestId ? manifestId : getFileUrl(fs, fsID, `iiif/index.json`, ipnsName);
      const jpg: string = getFileUrl(fs, fsID, `optimized.jpg`, ipnsName);
      const mp4: string = getFileUrl(fs, fsID, `optimized.mp4`, ipnsName);

      return (
        <>
          <div className="pt-8">
            <Tabs
              tabs={tabs.map((tab, _index) => {
                return {
                  name: tab.name,
                  label: tab.label,
                  current: tab.name === fs,
                };
              })}
              onChange={(current: number) => {
                const name: FileSystem = tabs[current].name;
                setFS(name);
                setFSID(name === 'GCS' ? id : cid);
              }}
            />
          </div>
          {/* thumbnail */}
          <div className="mt-8">
            <Label className="font-light text-gray-600 dark:text-white">
              <>{t('thumbnail')}</>
            </Label>
            <div className="mt-2 w-64">
              <a href={getFileUrl(fs, fsID, `thumb.jpg`)} target="_blank" rel="noreferrer">
                <img src={getFileUrl(fs, fsID, `thumb.jpg`)} alt={label} />
              </a>
              <div className="mt-2 space-x-4">
                <a
                  href={getFileUrl(fs, fsID, `regular.jpg`)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-blue-500 hover:underline"
                >
                  <>{t('regular')}</>
                </a>
                <a
                  href={getFileUrl(fs, fsID, `small.jpg`)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-blue-500 hover:underline"
                >
                  <>{t('small')}</>
                </a>
              </div>
            </div>
          </div>

          {(type === MIMETYPES.JPG || type === MIMETYPES.PNG || type === MIMETYPES.TIF || type === MIMETYPES.TIFF) && (
            <div className="mt-8">
              <Label htmlFor="jpg" className="font-light text-gray-600 dark:text-white">
                <>{t('JPG')}</>
              </Label>
              <div className="mt-2">
                <CopyText id="jpg" text={jpg} />
              </div>
              <a
                href={jpg}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-sm text-blue-500 hover:underline"
              >
                <>{t('view')}</>
              </a>
            </div>
          )}
          {type === MIMETYPES.GLB && (
            <div className="mt-8">
              <Label htmlFor="glb" className="font-light text-gray-600 dark:text-white">
                <>{t('glb')}</>
              </Label>
              <div className="mt-2">
                <CopyText id="glb" text={glb} />
              </div>
              <a
                href={`https://view-gltf.glitch.me?gltf=${glb}`}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-sm text-blue-500 hover:underline"
              >
                <>{t('view')}</>
              </a>
            </div>
          )}
          {type === MIMETYPES.MP4 && (
            <div className="mt-8 space-y-8">
              <div>
                <Label htmlFor="mp4" className="font-light text-gray-600 dark:text-white">
                  <>{t('mp4')}</>
                </Label>
                <div className="mt-2">
                  <CopyText id="mp4" text={mp4} />
                </div>
                <a
                  href={`${mp4}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-sm text-blue-500 hover:underline"
                >
                  <>{t('view')}</>
                </a>
              </div>

              <div>
                <Label htmlFor="dash" className="font-light text-gray-600 dark:text-white">
                  <>{t('dash')}</>
                </Label>
                <div className="mt-2">
                  <CopyText id="dash" text={dash} />
                </div>
                <a
                  href={`https://players.akamai.com/players/dashjs?streamUrl=${encodeURIComponent(dash)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-sm text-blue-500 hover:underline"
                >
                  <>{t('view')}</>
                </a>
              </div>

              <div>
                <Label htmlFor="hls" className="font-light text-gray-600 dark:text-white">
                  <>{t('hls')}</>
                </Label>
                <div className="mt-2">
                  <CopyText id="hls" text={hls} />
                </div>
                <a
                  href={`https://players.akamai.com/players/hlsjs?streamUrl=${hls}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-blue-500 hover:underline"
                >
                  <>{t('view')}</>
                </a>
              </div>
            </div>
          )}

          <div className="mt-8">
            <Label htmlFor="iiif" className="font-light text-gray-600 dark:text-white">
              <>{t('iiifManifest')}</>
            </Label>
            <div className="mt-2">
              <CopyText id="iiif" text={iiifManifest} />
              <a
                href={`https://www.universalviewer.dev/#?iiifManifestId=${iiifManifest}`}
                target="_blank"
                rel="noreferrer"
                title={t('viewOnUVLink')}
                className="mt-1 inline-block text-sm text-blue-500 hover:underline"
              >
                <>{t('view')}</>
              </a>
            </div>
          </div>

          <div className="mt-12 border-t border-zinc-800 pt-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">AT Protocol / Matadisco</h3>
                <p className="text-sm text-zinc-500">Publish this manifest to the Bluesky federated network.</p>
              </div>
              <div className="flex items-center gap-3">
                {atDid ? (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-3 py-1">
                    Live on Matadisco
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-zinc-500/10 text-zinc-500 border-zinc-500/20 px-3 py-1">
                    Draft
                  </Badge>
                )}
                <Button 
                  type="button"
                  variant={atDid ? "outline" : "default"}
                  onClick={onPublishAtproto}
                  disabled={isPublishRequested}
                >
                  {isPublishRequested ? (
                    "Broadcasting..."
                  ) : atDid ? (
                    "Update on Bluesky"
                  ) : (
                    "Publish to Bluesky"
                  )}
                </Button>
              </div>
            </div>

            {atDid && (
              <div className="mt-6 space-y-4 rounded-lg bg-zinc-900/50 p-4 border border-zinc-800">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-zinc-500">AT Protocol URI</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="text-sm text-zinc-300">at://{atDid}/cx.vmx.matadisco/{id}</code>
                  </div>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-zinc-500">Public Explorer Link</Label>
                  <div className="mt-1">
                    <a 
                      href={`https://atproto-browser.vercel.app/${atDid}/at://${atDid}/cx.vmx.matadisco/${id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-blue-500 hover:underline"
                    >
                      View on AT Protocol Browser →
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      );
    };

    return (
      <div className="relative">
        {!isProcessed && (
          <div className="absolute inset-0 z-50 flex items-center justify-center rounded-xl bg-zinc-950/60 backdrop-blur-sm transition-all duration-500">
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-center shadow-2xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                <Spinner />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-semibold tracking-tight text-white">Processing Asset</h3>
                <p className="max-w-[200px] text-sm text-zinc-400">
                  NIIIFTY is preparing your IIIF manifest and derivatives...
                </p>
              </div>
            </div>
          </div>
        )}
        
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit) as any} className="space-y-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-8">
                <FormField<FileFormData>
                  control={control as any}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Label <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter label" 
                          className=""
                          value={field.value as string}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField<FileFormData>
                  control={control as any}
                  name="summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Summary</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter summary"
                          className="min-h-[100px]"
                          value={field.value as string}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
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
                      <FormLabel>Provider</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="NIIIFTY"
                          value={field.value as string}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField<FileFormData>
                  control={control as any}
                  name="rights"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rights (License)</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value as string} 
                        value={field.value as string}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a license" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {licenses.map((l) => (
                            <SelectItem key={l.value} value={l.value}>
                              {l.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-8">
                {/* Tags Input with Badges */}
                <FormField<FileFormData>
                  control={control as any}
                  name="tags"
                  render={({ field }) => {
                    const tags = field.value as string[];
                    return (
                      <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <div className="space-y-4">
                          <Input
                            placeholder="Type and press enter to add tags"
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
                                  "flex items-center gap-1 px-3 py-1 text-sm font-medium transition-colors",
                                  tag === 'iiif' && "opacity-50 cursor-not-allowed" 
                                )}
                              >
                                {tag}
                                {tag !== 'iiif' && (
                                  <X 
                                    size={14} 
                                    className="cursor-pointer hover:text-red-500" 
                                    onClick={() => field.onChange(tags.filter(t => t !== tag))}
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

                {/* Metadata Builder */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Metadata</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ key: '', value: '' })}
                      className=""
                    >
                      <Plus size={16} className="mr-2" />
                      Add Field
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            {...form.register(`metadataEntries.${index}.key` as const)}
                            placeholder="Key"
                          />
                        </div>
                        <div className="flex-1">
                          <Input
                            {...form.register(`metadataEntries.${index}.value` as const)}
                            placeholder="Value"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeEntry(index)}
                          className="text-zinc-500 hover:bg-red-950 hover:text-red-500"
                        >
                          <X size={18} />
                        </Button>
                      </div>
                    ))}
                    {fields.length === 0 && (
                      <p className="text-sm text-zinc-500 italic">No custom metadata fields added.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Formats />

            <div className="flex flex-row items-center justify-end space-x-4 border-t border-zinc-800 pt-8">
              <Button type="submit" size="lg">
                {t('update')}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="lg"
                onClick={async () => {
                  if (
                    window.confirm(
                      t('confirmFileDeletion', {
                        title: label,
                      }),
                    )
                  ) {
                    await remove(userAdapter!, id);
                    window.location.href = '/admin/';
                  }
                }}
              >
                {t('delete')}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    );
  } else {
    return <LoadingMessage />;
  }
}
