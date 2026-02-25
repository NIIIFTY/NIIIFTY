'use client';

import '../../../i18n';

import { useEffect } from 'react';
import { auth, db } from '@/utils/Firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { UserAdapter } from '@/hooks/UserAdapter';
import { useUserStore } from '@/store/user-store';

export default function UserProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setUsername, setLoaded, setUserAdapter } = useUserStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        setUserAdapter(new UserAdapter(user));
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          setUsername(userSnap.data()?.username || null);
        } catch (error) {
          console.error('Error fetching username:', error);
          setUsername(null);
        }
      } else {
        setUserAdapter(null);
        setUsername(null);
      }
      setLoaded(true);
    });
    return unsubscribe;
  }, [setUser, setUsername, setLoaded, setUserAdapter]);

  return <>{children}</>;
}
