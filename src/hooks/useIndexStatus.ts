import { collection, query, where, limit } from 'firebase/firestore';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { db } from '@/lib/firebase';
import { useMemo } from 'react';

export function useIndexStatus(id: string | undefined | null) {
  const indexQuery = useMemo(() => {
    if (!id) return null;
    return query(
      collection(db, 'matadisco_index'),
      where('rkey', '==', id),
      limit(1)
    );
  }, [id]);

  const [data, loading, error] = useCollectionData(indexQuery);

  const record = data?.[0];

  return {
    isIndexed: !!record,
    uri: record?.uri || null,
    loading,
    error
  };
}
