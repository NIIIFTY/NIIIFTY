'use client';

import { SearchAppView } from '@/components/SearchAppView';
import { useMounted } from '@/hooks/useMounted';

export default function ExplorePage() {
  const isMounted = useMounted();

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <SearchAppView />
    </div>
  );
}
