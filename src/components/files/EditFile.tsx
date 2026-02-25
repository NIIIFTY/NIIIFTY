'use client';

import { useState } from 'react';
import { useUserStore } from '@/store/user-store';
import { useTranslation } from 'react-i18next';
import { LoadingMessage } from '../LoadingMessage';
import { remove, useAuthoringFile } from '@/hooks/useFile';
import { AuthoringFile, FileSystem, LicenseURL, MIMETYPES } from '@/utils/Types';
import { useMounted } from '@/hooks/useMounted';
import Alert from '../Alert';
import { getFileUrl } from '@/utils/Utils';
import CopyText from '../CopyText';
import Tabs, { Tab } from '../Tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const fileSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .regex(/^[\w\-\s]+$/, 'Invalid title format (alphanumeric, dashes, spaces only)'),
  description: z.string().optional(),
  attribution: z.string().optional(),
  license: z.string().optional(),
});

type FileFormData = z.infer<typeof fileSchema>;

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

  const form = useForm<FileFormData>({
    resolver: zodResolver(fileSchema),
    defaultValues: {
      title: '',
      description: '',
      attribution: '',
      license: 'https://creativecommons.org/publicdomain/zero/1.0/' as LicenseURL,
    },
  });

  const { handleSubmit, setValue, watch } = form;

  const [_file, { update }] = useAuthoringFile(userAdapter!, id as string, {
    onData: (file) => {
      setValue('title', file.title);
      setValue('description', file.description || '');
      setValue('attribution', file.attribution || '');
      setValue('license', file.license);
      setCid(file.cid);
      setType(file.type);
    },
    onError: () => {
      setPageError('fileNotFound');
    },
  });

  const isMounted = useMounted();
  const title = watch('title') || '';

  const onSubmit = async (data: FileFormData) => {
    await update!(
      userAdapter!,
      id as string,
      {
        ...data,
        license: data.license as LicenseURL,
      } as AuthoringFile,
    );
    window.location.href = '/admin/';
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

      const dash: string = getFileUrl(fs, fsID, `dash/optimized.mpd`);
      const glb: string = getFileUrl(fs, fsID, `optimized.glb`);
      const hls: string = getFileUrl(fs, fsID, `hls/optimized.m3u8`);
      const iiifManifest: string = getFileUrl(fs, fsID, `iiif/index.json`);
      const jpg: string = getFileUrl(fs, fsID, `optimized.jpg`);
      const mp4: string = getFileUrl(fs, fsID, `optimized.mp4`);

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
                <img src={getFileUrl(fs, fsID, `thumb.jpg`)} alt={title} />
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
        </>
      );
    };

    return (
      <>
        {/* Removed Metatags as dynamic metadata is handled by page.tsx */}
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('title')} <span className="text-red-700">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={t('title')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('description')}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t('description')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="attribution"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('attribution')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('attribution')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="license"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('license')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
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

            <Formats />

            <div className="flex flex-row items-center justify-start space-x-4">
              <Button type="submit" size="lg">
                {t('update')}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="lg"
                className="ml-auto"
                onClick={async () => {
                  if (
                    window.confirm(
                      t('confirmFileDeletion', {
                        title: title,
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
      </>
    );
  } else {
    return <LoadingMessage />;
  }
}
