'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import Link from '@/components/Link';
import { useFirebaseEmulators } from '@/lib/config';

interface SearchResult {
  id: string;
  atUri: string;
  label: string;
  summary: string;
  type: string;
  author: string;
  handle?: string;
  thumbnailUrl?: string;
}

export function SearchAppView() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const initialSearchDone = useRef(false);

  const executeSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setHasSearched(true);
    try {
      const searchFn = httpsCallable(functions, 'appview-searchAppView');
      const response = await searchFn({ query: searchQuery, limit: 12 });
      const data = response.data as { results: SearchResult[] };
      setResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only execute automatically on initial load if query exists
    const q = searchParams.get('q');
    if (q && !initialSearchDone.current) {
      initialSearchDone.current = true;
      executeSearch(q);
    }
  }, [searchParams]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    // Update URL quietly so back button works
    const params = new URLSearchParams(searchParams.toString());
    params.set('q', query);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    
    executeSearch(query);
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col items-center mb-12">
        <form onSubmit={handleSearch} className="flex w-full max-w-2xl gap-2">
          <Input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-grow text-lg h-12 shadow-sm"
          />
          <Button type="submit" disabled={loading} className="h-12 px-8">
            {loading ? <Spinner className="w-5 h-5" /> : t('search')}
          </Button>
        </form>
      </div>
      
      {!loading && !hasSearched && useFirebaseEmulators && (
        <div className="flex flex-col items-center justify-center mb-12">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 max-w-2xl w-full text-center">
            <h3 className="text-blue-800 dark:text-blue-300 font-bold mb-3">🛠 Local Mock Search Active</h3>
            <p className="text-blue-600 dark:text-blue-400 text-sm mb-4">
              You are running the local emulator. Vector search is disabled.
              Try searching for these mock keywords:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <button onClick={() => { setQuery('cyberpunk'); handleSearch(); }} className="px-3 py-1 bg-white dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 rounded-full text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors">Cyberpunk</button>
              <button onClick={() => { setQuery('helmet'); handleSearch(); }} className="px-3 py-1 bg-white dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 rounded-full text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors">Helmet</button>
              <button onClick={() => { setQuery('camera'); handleSearch(); }} className="px-3 py-1 bg-white dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 rounded-full text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors">Camera</button>
              <button onClick={() => { setQuery('vintage'); handleSearch(); }} className="px-3 py-1 bg-white dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 rounded-full text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors">Vintage</button>
              <button onClick={() => { setQuery('neon'); handleSearch(); }} className="px-3 py-1 bg-white dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 rounded-full text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors">Neon</button>
              <button onClick={() => { setQuery('cityscape'); handleSearch(); }} className="px-3 py-1 bg-white dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 rounded-full text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors">Cityscape</button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="flex flex-col items-center gap-4">
            <Spinner className="w-10 h-10 text-blue-600" />
            <p className="text-zinc-500 font-medium">{t('searching')}</p>
          </div>
        </div>
      )}

      {!loading && hasSearched && results.length === 0 && (
        <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <p className="text-xl text-zinc-500">{t('noResultsFound')}</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((result) => (
            <div 
              key={result.id} 
              className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
            >
              {result.thumbnailUrl ? (
                <div className="aspect-video relative overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  <img 
                    src={result.thumbnailUrl} 
                    alt={result.label}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 bg-black/50 backdrop-blur-md text-[10px] font-bold text-white rounded-full uppercase tracking-widest">
                      {result.type}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <span className="text-zinc-400 font-bold uppercase tracking-widest text-xs">{result.type}</span>
                </div>
              )}
              
              <div className="p-5 flex-grow flex flex-col">
                <h3 className="text-lg font-bold mb-2 line-clamp-1 dark:text-zinc-100">{result.label}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-3 mb-4 flex-grow">
                  {result.summary || 'No description available.'}
                </p>
                
                <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Author</span>
                    <span className="text-xs font-medium dark:text-zinc-300 truncate max-w-[150px]">
                      {result.handle ? `@${result.handle}` : `@${result.author.split('.')[0]}`}
                    </span>
                  </div>
                  <Link 
                    href={`/view/${result.id}`} 
                    className="text-blue-600 dark:text-blue-400 text-sm font-bold hover:underline"
                  >
                    {t('view')} →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
