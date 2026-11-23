import { ChevronDown, Droplets, Sunrise, Sunset, SunMedium, Wind } from 'lucide-react';
import { useState } from 'react';
import { DailyForecastPoint, TemperatureUnit } from '../types/weather';
import {
  convertTemp,
  formatClockTime,
  getUvLabel,
  getWeatherInfo,
} from '../utils/weatherCodes';
import { WeatherIcon } from './WeatherIcon';

interface DailyForecastListProps {
  daily: DailyForecastPoint[];
  unit: TemperatureUnit;
}

export function DailyForecastList({ daily, unit }: DailyForecastListProps) {
  const [expandedDate, setExpandedDate] = useState<string | null>(daily[0]?.date ?? null);

  if (daily.length === 0) return null;

  const weekMin = Math.min(...daily.map((d) => d.temperatureMin));
  const weekMax = Math.max(...daily.map((d) => d.temperatureMax));
  const totalSpan = Math.max(weekMax - weekMin, 1);

  return (
    <section
      id="siete-dias"
      aria-labelledby="daily-heading"
      className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
        <div>
          <h2
            id="daily-heading"
            className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100"
          >
            Pronóstico para 7 días
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Mínimas, máximas y probabilidad de lluvia · Selecciona un día para ver más detalles
          </p>
        </div>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {daily.map((day) => {
          const isExpanded = expandedDate === day.date;
          const info = getWeatherInfo(day.weatherCode);
          const leftPct = ((day.temperatureMin - weekMin) / totalSpan) * 100;
          const widthPct = Math.max(
            ((day.temperatureMax - day.temperatureMin) / totalSpan) * 100,
            6
          );

          return (
            <div key={day.date} className="py-1">
              <button
                type="button"
                aria-expanded={isExpanded}
                onClick={() => setExpandedDate(isExpanded ? null : day.date)}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 dark:hover:bg-slate-800/50"
              >
                {/* Day & Date */}
                <div className="w-28 shrink-0 sm:w-36">
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {day.dayLabel}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {day.shortDate}
                  </div>
                </div>

                {/* Condition icon + label */}
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <WeatherIcon code={day.weatherCode} isDay={true} size={20} />
                  <span className="hidden truncate text-sm text-slate-600 sm:inline dark:text-slate-300">
                    {info.label}
                  </span>
                </div>

                {/* Rain probability */}
                <div className="flex w-14 shrink-0 items-center justify-end gap-1 font-mono text-xs tabular-nums text-sky-700 dark:text-sky-400">
                  <Droplets size={12} aria-hidden="true" />
                  <span>{day.precipitationProbabilityMax}%</span>
                </div>

                {/* Min-Max range bar */}
                <div className="flex w-36 shrink-0 items-center gap-2 sm:w-48">
                  <span className="w-8 text-right font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                    {convertTemp(day.temperatureMin, unit)}°
                  </span>
                  <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="absolute top-0 bottom-0 rounded-full bg-sky-600 dark:bg-sky-400"
                      style={{
                        left: `${leftPct.toFixed(1)}%`,
                        width: `${widthPct.toFixed(1)}%`,
                      }}
                    />
                  </div>
                  <span className="w-8 font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {convertTemp(day.temperatureMax, unit)}°
                  </span>
                </div>

                <ChevronDown
                  size={16}
                  className={`shrink-0 text-slate-400 transition-transform duration-150 ${
                    isExpanded ? 'rotate-180 text-slate-700 dark:text-slate-200' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {isExpanded && (
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 px-3 py-3 text-xs sm:grid-cols-4 dark:border-slate-800/80">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <SunMedium size={14} className="text-amber-500" aria-hidden="true" />
                    <span>
                      Índice UV máx:{' '}
                      <strong className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                        {day.uvIndexMax.toFixed(1)}
                      </strong>{' '}
                      ({getUvLabel(day.uvIndexMax)})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Wind size={14} className="text-sky-600 dark:text-sky-400" aria-hidden="true" />
                    <span>
                      Viento máx:{' '}
                      <strong className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                        {Math.round(day.windSpeedMax)} km/h
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Sunrise size={14} className="text-amber-500" aria-hidden="true" />
                    <span>
                      Amanecer:{' '}
                      <strong className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                        {formatClockTime(day.sunrise)}
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Sunset size={14} className="text-slate-500 dark:text-slate-400" aria-hidden="true" />
                    <span>
                      Atardecer:{' '}
                      <strong className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                        {formatClockTime(day.sunset)}
                      </strong>
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
