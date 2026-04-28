'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import Link from '@/components/Link';

interface SearchResult {
  id: string;
  atUri: string;
  label: string;
  summary: string;
  type: string;
  author: string;
  thumbnailUrl?: string;
}

export function SearchAppView() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const searchFn = httpsCallable(functions, 'appview-searchAppView');
      const response = await searchFn({ query, limit: 12 });
      const data = response.data as { results: SearchResult[] };
      setResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col items-center mb-12">
        <h1 className="text-4xl font-black mb-4 tracking-tight">{t('explore')}</h1>
        <form onSubmit={handleSearch} className="flex w-full max-w-2xl gap-2">
          <Input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-grow text-lg h-12 shadow-sm"
          />
          <Button type="submit" disabled={loading} className="h-12 px-8">
            {loading ? <Spinner className="w-5 h-5" /> : t('browse')}
          </Button>
        </form>
      </div>

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
                      {result.type.split('/')[1] || result.type}
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
                    <span className="text-xs font-medium dark:text-zinc-300">@{result.author.split('.')[0]}</span>
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
