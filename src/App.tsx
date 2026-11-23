import {
  Bookmark,
  LocateFixed,
  Moon,
  RefreshCw,
  Sun,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { CitySearch } from './components/CitySearch';
import { DailyForecastList } from './components/DailyForecastList';
import { HourlyChart } from './components/HourlyChart';
import { WeatherIcon } from './components/WeatherIcon';
import {
  DEFAULT_CITIES,
  fetchWeatherForecast,
  reverseGeocodeCity,
} from './services/weatherApi';
import { CityLocation, TemperatureUnit, WeatherData } from './types/weather';
import {
  convertTemp,
  formatClockTime,
  getUvLabel,
  getWeatherAdvice,
  getWeatherInfo,
  getWindCardinal,
} from './utils/weatherCodes';

const STORAGE_KEYS = {
  SAVED_CITIES: 'luisito_comunica_saved_cities',
  SELECTED_CITY: 'luisito_comunica_selected_city',
  UNIT: 'luisito_comunica_unit',
  THEME: 'luisito_comunica_theme',
};

function loadInitialCities(): CityLocation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_CITIES);
    if (raw) {
      const parsed = JSON.parse(raw) as CityLocation[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Ignore storage errors
  }
  return DEFAULT_CITIES;
}

function loadInitialCity(savedCities: CityLocation[]): CityLocation {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SELECTED_CITY);
    if (raw) {
      const parsed = JSON.parse(raw) as CityLocation;
      if (parsed && typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
        return parsed;
      }
    }
  } catch {
    // Ignore storage errors
  }
  return savedCities[0] ?? DEFAULT_CITIES[0];
}

function loadInitialUnit(): TemperatureUnit {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.UNIT);
    if (raw === 'fahrenheit' || raw === 'celsius') return raw;
  } catch {
    // Ignore storage errors
  }
  return 'celsius';
}

function loadInitialDark(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.THEME);
    if (raw === 'dark') return true;
    if (raw === 'light') return false;
  } catch {
    // Ignore storage errors
  }
  return false;
}

export default function App() {
  const [savedCities, setSavedCities] = useState<CityLocation[]>(loadInitialCities);
  const [selectedCity, setSelectedCity] = useState<CityLocation>(() =>
    loadInitialCity(savedCities)
  );
  const [unit, setUnit] = useState<TemperatureUnit>(loadInitialUnit);
  const [isDark, setIsDark] = useState<boolean>(loadInitialDark);

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState<number>(0);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
    } catch {
      // Ignore storage errors
    }
  }, [isDark]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.UNIT, unit);
    } catch {
      // Ignore storage errors
    }
  }, [unit]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SAVED_CITIES, JSON.stringify(savedCities));
    } catch {
      // Ignore storage errors
    }
  }, [savedCities]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SELECTED_CITY, JSON.stringify(selectedCity));
    } catch {
      // Ignore storage errors
    }
  }, [selectedCity]);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    fetchWeatherForecast(selectedCity, controller.signal)
      .then((data) => {
        setWeather(data);
        setIsLoading(false);
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError') return;
        setError(err.message || 'No se pudo cargar el pronóstico.');
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [selectedCity, reloadNonce]);

  const handleSelectCity = useCallback((city: CityLocation) => {
    setLocationNotice(null);
    setSelectedCity(city);
  }, []);

  const isCurrentCitySaved = savedCities.some((c) => c.id === selectedCity.id);

  const handleToggleSaveCity = () => {
    if (isCurrentCitySaved) {
      if (savedCities.length <= 1) return;
      setSavedCities((prev) => prev.filter((c) => c.id !== selectedCity.id));
    } else {
      setSavedCities((prev) => [selectedCity, ...prev].slice(0, 8));
    }
  };

  const handleRemoveCity = (cityId: string) => {
    if (savedCities.length <= 1) return;
    setSavedCities((prev) => {
      const next = prev.filter((c) => c.id !== cityId);
      if (selectedCity.id === cityId && next[0]) {
        setSelectedCity(next[0]);
      }
      return next;
    });
  };

  const handleUseMyLocation = () => {
    setLocationNotice(null);
    if (!('geolocation' in navigator)) {
      setLocationNotice('Tu navegador no admite geolocalización.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const city = await reverseGeocodeCity(pos.coords.latitude, pos.coords.longitude);
          setSelectedCity(city);
        } catch {
          setLocationNotice('No se pudo determinar tu ciudad actual.');
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        setLocationNotice('Permiso de ubicación denegado o no disponible.');
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  const currentInfo = weather ? getWeatherInfo(weather.current.weatherCode) : null;
  const todayDaily = weather?.daily[0];
  const unitSuffix = unit === 'celsius' ? 'C' : 'F';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      {/* Top Bar: 3 zones separated by gap-8 */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#actual"
            className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 dark:text-white"
          >
            Luisito Comunica
          </a>

          {/* Zone 2: Concise single-line nav links */}
          <nav
            aria-label="Secciones del pronóstico"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300"
          >
            <a
              href="#actual"
              className="whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 hover:underline hover:underline-offset-4 dark:hover:text-white"
            >
              Actual
            </a>
            <a
              href="#por-hora"
              className="whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 hover:underline hover:underline-offset-4 dark:hover:text-white"
            >
              Por hora
            </a>
            <a
              href="#siete-dias"
              className="whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 hover:underline hover:underline-offset-4 dark:hover:text-white"
            >
              Pronóstico 7 días
            </a>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={isLocating}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-sky-600 px-4 text-xs font-semibold text-white whitespace-nowrap shrink-0 transition-colors hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 disabled:opacity-60 dark:bg-sky-600 dark:hover:bg-sky-500 dark:focus-visible:ring-offset-slate-900"
            >
              <LocateFixed
                size={15}
                className={isLocating ? 'animate-spin' : ''}
                aria-hidden="true"
              />
              <span>{isLocating ? 'Ubicando...' : 'Mi ubicación'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        {/* Workspace Toolbar */}
        <section
          aria-label="Búsqueda y preferencias"
          className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <CitySearch onSelectCity={handleSelectCity} />

            {/* Quick city selector */}
            <div
              role="group"
              aria-label="Ciudades guardadas"
              className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0"
            >
              {savedCities.map((city) => {
                const isActive = city.id === selectedCity.id;
                return (
                  <div
                    key={city.id}
                    className={`inline-flex shrink-0 items-center rounded-lg border text-xs font-medium transition-colors ${
                      isActive
                        ? 'border-sky-600 bg-sky-50 text-sky-900 dark:border-sky-500 dark:bg-sky-950/50 dark:text-sky-200'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectCity(city)}
                      className="px-3 py-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded-l-lg"
                    >
                      {city.name}
                    </button>
                    {savedCities.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCity(city.id)}
                        aria-label={`Quitar ${city.name}`}
                        className="pr-2 pl-0.5 py-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Unit & Theme Controls */}
          <div className="flex items-center gap-2 self-start lg:self-auto">
            <div
              role="group"
              aria-label="Unidad de temperatura"
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900"
            >
              <button
                type="button"
                onClick={() => setUnit('celsius')}
                aria-pressed={unit === 'celsius'}
                className={`rounded-md px-3 py-1.5 font-mono text-xs font-semibold whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${
                  unit === 'celsius'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                °C
              </button>
              <button
                type="button"
                onClick={() => setUnit('fahrenheit')}
                aria-pressed={unit === 'fahrenheit'}
                className={`rounded-md px-3 py-1.5 font-mono text-xs font-semibold whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${
                  unit === 'fahrenheit'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                °F
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsDark((prev) => !prev)}
              aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-700 whitespace-nowrap shrink-0 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {isDark ? <Sun size={15} aria-hidden="true" /> : <Moon size={15} aria-hidden="true" />}
              <span>{isDark ? 'Claro' : 'Oscuro'}</span>
            </button>
          </div>
        </section>

        {locationNotice && (
          <div
            role="status"
            className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200"
          >
            <span>{locationNotice}</span>
            <button
              type="button"
              onClick={() => setLocationNotice(null)}
              aria-label="Cerrar aviso"
              className="rounded p-1 hover:bg-amber-100 dark:hover:bg-amber-900/40"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6" aria-busy="true" aria-label="Cargando pronóstico">
            <div className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900" />
            <div className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900" />
            <div className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900" />
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div
            role="alert"
            className="flex flex-col items-start justify-between gap-4 rounded-xl border border-red-200 bg-white p-6 sm:flex-row sm:items-center dark:border-red-900/60 dark:bg-slate-900"
          >
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                No se pudo cargar el clima
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => setReloadNonce((n) => n + 1)}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              <RefreshCw size={14} aria-hidden="true" />
              <span>Reintentar</span>
            </button>
          </div>
        )}

        {/* Main Weather Content */}
        {!isLoading && !error && weather && currentInfo && todayDaily && (
          <>
            {/* Current Weather Hero */}
            <section
              id="actual"
              aria-labelledby="city-heading"
              className="rounded-xl border border-slate-200 bg-white p-5 sm:p-8 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
                {/* Primary temperature & location */}
                <div className="lg:col-span-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h1
                        id="city-heading"
                        className="font-display text-3xl font-bold tracking-tight text-slate-900 text-balance sm:text-4xl dark:text-white"
                      >
                        {weather.location.name}
                      </h1>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <span>
                          {[weather.location.admin1, weather.location.country]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          Hora local {formatClockTime(weather.current.time)}
                        </span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleSaveCity}
                      disabled={isCurrentCitySaved && savedCities.length <= 1}
                      aria-label={
                        isCurrentCitySaved
                          ? 'Quitar de ciudades guardadas'
                          : 'Guardar ciudad en accesos rápidos'
                      }
                      className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 disabled:opacity-40 ${
                        isCurrentCitySaved
                          ? 'border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-300'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <Bookmark
                        size={13}
                        className={isCurrentCitySaved ? 'fill-current' : ''}
                        aria-hidden="true"
                      />
                      <span>{isCurrentCitySaved ? 'Guardada' : 'Guardar'}</span>
                    </button>
                  </div>

                  <div className="mt-6 flex items-center gap-5">
                    <WeatherIcon
                      code={weather.current.weatherCode}
                      isDay={weather.current.isDay}
                      size={56}
                    />
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-6xl font-bold tracking-tight tabular-nums text-slate-900 sm:text-7xl dark:text-white">
                        {convertTemp(weather.current.temperature, unit)}°
                      </span>
                      <span className="font-mono text-xl font-medium text-slate-400 dark:text-slate-500">
                        {unitSuffix}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {currentInfo.label}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
                      ·
                    </span>
                    <span className="tabular-nums">
                      Sensación térmica{' '}
                      <strong className="font-mono font-semibold text-slate-900 dark:text-white">
                        {convertTemp(weather.current.apparentTemperature, unit)}°
                      </strong>
                    </span>
                    <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
                      ·
                    </span>
                    <span className="font-mono tabular-nums">
                      Máx {convertTemp(todayDaily.temperatureMax, unit)}° / Mín{' '}
                      {convertTemp(todayDaily.temperatureMin, unit)}°
                    </span>
                  </div>

                  <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {getWeatherAdvice(
                      weather.current.weatherCode,
                      weather.current.temperature,
                      todayDaily.precipitationProbabilityMax,
                      todayDaily.uvIndexMax
                    )}
                  </p>
                </div>

                {/* Hairline-divided Atmospheric Metrics Grid (no nested cards) */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-slate-100 pt-6 sm:grid-cols-3 lg:col-span-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8 dark:border-slate-800">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Humedad</div>
                    <div className="mt-1 font-mono text-xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                      {Math.round(weather.current.humidity)}%
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Viento</div>
                    <div className="mt-1 font-mono text-xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                      {Math.round(weather.current.windSpeed)} km/h
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      Dirección {getWindCardinal(weather.current.windDirection)}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Índice UV máx</div>
                    <div className="mt-1 font-mono text-xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                      {todayDaily.uvIndexMax.toFixed(1)}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {getUvLabel(todayDaily.uvIndexMax)}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Prob. de lluvia hoy
                    </div>
                    <div className="mt-1 font-mono text-xl font-semibold tabular-nums text-sky-700 dark:text-sky-400">
                      {todayDaily.precipitationProbabilityMax}%
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Presión</div>
                    <div className="mt-1 font-mono text-xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                      {Math.round(weather.current.surfacePressure)} hPa
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Nubosidad</div>
                    <div className="mt-1 font-mono text-xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                      {Math.round(weather.current.cloudCover)}%
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 24-Hour Forecast */}
            <HourlyChart hourly={weather.hourly} unit={unit} />

            {/* 7-Day Forecast */}
            <DailyForecastList daily={weather.daily} unit={unit} />
          </>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 text-xs text-slate-500 sm:px-6 dark:text-slate-400">
          <span>Luisito Comunica · Datos meteorológicos en tiempo real</span>
          <button
            type="button"
            onClick={() => setReloadNonce((n) => n + 1)}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 font-medium text-slate-700 transition-colors hover:text-slate-900 disabled:opacity-50 dark:text-slate-300 dark:hover:text-white"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} aria-hidden="true" />
            <span>Actualizar datos</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
