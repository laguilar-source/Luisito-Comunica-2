import { Loader2, MapPin, Search, X } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { searchCities } from '../services/weatherApi';
import { CityLocation } from '../types/weather';

interface CitySearchProps {
  onSelectCity: (city: CityLocation) => void;
}

export function CitySearch({ onSelectCity }: CitySearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CityLocation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsOpen(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const cities = await searchCities(trimmed, controller.signal);
        setResults(cities);
        setActiveIndex(cities.length > 0 ? 0 : -1);
        setIsOpen(true);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError('No se pudo completar la búsqueda.');
          setResults([]);
          setIsOpen(true);
        }
      } finally {
        setIsLoading(false);
      }
    }, 260);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const handleChoose = (city: CityLocation) => {
    onSelectCity(city);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1 < results.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 >= 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
      e.preventDefault();
      handleChoose(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full md:max-w-sm">
      <div className="relative flex items-center">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 text-slate-400 dark:text-slate-500"
          aria-hidden="true"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0 || error) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Buscar ciudad (ej. Guadalajara, París)..."
          aria-label="Buscar ciudad"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-9 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/15 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-500"
        />
        {isLoading ? (
          <Loader2
            size={15}
            className="absolute right-3 animate-spin text-slate-400"
            aria-hidden="true"
          />
        ) : query.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            aria-label="Limpiar búsqueda"
            className="absolute right-2 flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 right-0 z-30 mt-1.5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900"
        >
          {error ? (
            <div className="px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
              No se encontraron ciudades para “{query.trim()}”.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {results.map((city, idx) => (
                <li key={city.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={idx === activeIndex}
                    onClick={() => handleChoose(city)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm transition-colors ${
                      idx === activeIndex
                        ? 'bg-sky-50 text-slate-900 dark:bg-sky-950/50 dark:text-white'
                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <MapPin
                        size={15}
                        className="shrink-0 text-sky-600 dark:text-sky-400"
                        aria-hidden="true"
                      />
                      <span className="truncate font-medium">{city.name}</span>
                    </span>
                    <span className="shrink-0 truncate text-xs text-slate-500 dark:text-slate-400">
                      {[city.admin1, city.country].filter(Boolean).join(', ')}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
