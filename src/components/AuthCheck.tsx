'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/store/user-store';

export default function AuthCheck({
  signedInContent,
  fallbackContent,
}: {
  signedInContent: React.ReactNode;
  fallbackContent?: React.ReactNode;
}) {
  const { user, username, loaded } = useUserStore();

  useEffect(() => {
    if (loaded && !username) {
      window.location.href = '/enter';
    }
  }, [user, username, loaded]);

  if (loaded && user && username) {
    return signedInContent;
  }

  return fallbackContent;
}
