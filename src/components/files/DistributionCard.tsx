import React from 'react';
import { useTranslation } from 'react-i18next';
import { HardDrive, ExternalLink } from 'lucide-react';
import { DetailCard } from './layout/DetailCard';
import Tabs, { Tab } from '../Tabs';
import CopyText from '../CopyText';
import { Label } from '@/components/ui/label';
import { getFileUrl } from '@/utils/Utils';
import { FileSystem, MIMETYPES } from '@/utils/Types';

type TabName = 'GCS' | 'IPFS';

interface DistributionCardProps {
  fs: FileSystem;
  setFS: (fs: FileSystem) => void;
  id: string; // The GCS / NIIIFTY id
  cid?: string; // The IPFS CID
  type: string;
  isProcessed: boolean;
}

export function DistributionCard({ fs, setFS, id, cid, type, isProcessed }: DistributionCardProps) {
  const { t } = useTranslation();

  const tabs: Tab<TabName>[] = [
    {
      name: 'GCS',
      label: t('googleCloudStorage'),
    },
    {
      name: 'IPFS',
      label: t('ipfs'),
    },
  ];

  const fsID = fs === 'GCS' ? id : (cid || id);

  const jpg = getFileUrl(fs, fsID, `optimized.jpg`);
  const glb = getFileUrl(fs, fsID, `optimized.glb`);
  const mp4 = getFileUrl(fs, fsID, `optimized.mp4`);
  const dash = getFileUrl(fs, fsID, `dash/optimized.mpd`);
  const hls = getFileUrl(fs, fsID, `hls/optimized.m3u8`);
  const iiifManifest = getFileUrl(fs, fsID, `iiif/index.json`);

  return (
    <DetailCard title="Distribution" icon={HardDrive} size="md">
      <Tabs
        tabs={tabs.map((tab) => ({
          name: tab.name,
          label: tab.label,
          current: tab.name === fs,
        }))}
        onChange={(current: number) => {
          const name: FileSystem = tabs[current].name;
          setFS(name);
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

        <div className="space-y-2">
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
    </DetailCard>
  );
}
