import { useCallback, useEffect, useState } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  }, [initialValue, key]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  useEffect(() => {
    setStoredValue(readValue());
  }, [readValue]);

  const setValue = useCallback(
    (value: T | ((previousValue: T) => T)) => {
      setStoredValue((prev) => {
        const nextValue = value instanceof Function ? value(prev) : value;

        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(key, JSON.stringify(nextValue));
          } catch (error) {
            console.error(error);
          }
        }

        return nextValue;
      });
    },
    [key],
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === key) {
        try {
          const nextValue = event.newValue !== null ? (JSON.parse(event.newValue) as T) : initialValue;
          setStoredValue(nextValue);
        } catch (error) {
          console.error(error);
          setStoredValue(initialValue);
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [initialValue, key]);

  return [storedValue, setValue] as const;
}
