import { Droplets } from 'lucide-react';
import { useState } from 'react';
import { HourlyForecastPoint, TemperatureUnit } from '../types/weather';
import { convertTemp, getWeatherInfo } from '../utils/weatherCodes';
import { WeatherIcon } from './WeatherIcon';

interface HourlyChartProps {
  hourly: HourlyForecastPoint[];
  unit: TemperatureUnit;
}

export function HourlyChart({ hourly, unit }: HourlyChartProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (hourly.length === 0) return null;

  const displayHours = hourly.slice(0, 24);
  const safeSelected = Math.min(selectedIndex, displayHours.length - 1);
  const activePoint = displayHours[safeSelected];

  const temps = displayHours.map((h) => convertTemp(h.temperature, unit));
  const minT = Math.min(...temps);
  const maxT = Math.max(...temps);
  const span = Math.max(maxT - minT, 4);

  const width = 760;
  const height = 148;
  const padX = 24;
  const padTop = 26;
  const padBottom = 26;
  const usableHeight = height - padTop - padBottom;

  const coords = displayHours.map((item, idx) => {
    const x = padX + (idx / Math.max(displayHours.length - 1, 1)) * (width - padX * 2);
    const t = convertTemp(item.temperature, unit);
    const normalized = (t - minT) / span;
    const y = padTop + (1 - normalized) * usableHeight;
    return { x, y, t, item, idx };
  });

  const linePath = coords
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ');

  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${(
    height - padBottom + 10
  ).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(height - padBottom + 10).toFixed(1)} Z`;

  const selectedCoord = coords[safeSelected];

  return (
    <section
      id="por-hora"
      aria-labelledby="hourly-heading"
      className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
        <div>
          <h2
            id="hourly-heading"
            className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100"
          >
            Pronóstico por hora
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Próximas 24 horas · Haz clic o pasa sobre una hora para ver el detalle
          </p>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <span className="font-mono font-medium tabular-nums text-slate-900 dark:text-slate-100">
            {activePoint.hourLabel}
          </span>
          <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
            ·
          </span>
          <span className="font-mono font-semibold tabular-nums text-sky-700 dark:text-sky-400">
            {convertTemp(activePoint.temperature, unit)}°{unit === 'celsius' ? 'C' : 'F'}
          </span>
          <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
            ·
          </span>
          <span className="text-slate-600 dark:text-slate-300">
            {getWeatherInfo(activePoint.weatherCode).label}
          </span>
        </div>
      </div>

      {/* Responsive SVG temperature curve */}
      <div className="mt-4 w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-36 w-full select-none"
          role="img"
          aria-label="Gráfica de temperatura para las próximas 24 horas"
        >
          <defs>
            <linearGradient id="tempCurveFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          <path d={areaPath} fill="url(#tempCurveFill)" />
          <path
            d={linePath}
            fill="none"
            stroke="#0284c7"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Selected vertical guide */}
          <line
            x1={selectedCoord.x}
            y1={padTop - 8}
            x2={selectedCoord.x}
            y2={height - padBottom + 8}
            stroke="currentColor"
            className="text-slate-300 dark:text-slate-700"
            strokeDasharray="3 3"
            strokeWidth="1"
          />

          {coords.map((pt) => {
            const isSelected = pt.idx === safeSelected;
            const showLabel = isSelected || pt.idx % 3 === 0;
            return (
              <g
                key={pt.item.time}
                className="cursor-pointer"
                onClick={() => setSelectedIndex(pt.idx)}
                onMouseEnter={() => setSelectedIndex(pt.idx)}
              >
                <rect
                  x={pt.x - 14}
                  y={0}
                  width={28}
                  height={height}
                  fill="transparent"
                />
                {showLabel && (
                  <text
                    x={pt.x}
                    y={pt.y - 10}
                    textAnchor="middle"
                    className={`font-mono text-[11px] tabular-nums ${
                      isSelected
                        ? 'fill-sky-700 font-semibold dark:fill-sky-300'
                        : 'fill-slate-500 dark:fill-slate-400'
                    }`}
                  >
                    {pt.t}°
                  </text>
                )}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? 4.5 : 2.25}
                  className={
                    isSelected
                      ? 'fill-sky-600 stroke-white stroke-2 dark:fill-sky-400 dark:stroke-slate-900'
                      : 'fill-sky-600/60 dark:fill-sky-400/60'
                  }
                />
                {showLabel && (
                  <text
                    x={pt.x}
                    y={height - 6}
                    textAnchor="middle"
                    className={`font-mono text-[10px] tabular-nums ${
                      isSelected
                        ? 'fill-slate-900 font-semibold dark:fill-slate-100'
                        : 'fill-slate-400 dark:fill-slate-500'
                    }`}
                  >
                    {pt.item.hourLabel}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Clean horizontal hourly cells */}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {displayHours.map((item, idx) => {
          const isSelected = idx === safeSelected;
          return (
            <button
              key={item.time}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`flex min-w-[68px] shrink-0 flex-col items-center gap-1.5 rounded-lg border px-2.5 py-2.5 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${
                isSelected
                  ? 'border-sky-600 bg-sky-50/70 dark:border-sky-500 dark:bg-sky-950/40'
                  : 'border-slate-100 bg-slate-50/60 hover:border-slate-200 hover:bg-slate-50 dark:border-slate-800/80 dark:bg-slate-950/40 dark:hover:border-slate-700'
              }`}
            >
              <span className="font-mono text-xs font-medium tabular-nums text-slate-600 dark:text-slate-300">
                {item.hourLabel}
              </span>
              <WeatherIcon code={item.weatherCode} isDay={item.isDay} size={20} />
              <span className="font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {convertTemp(item.temperature, unit)}°
              </span>
              <span className="flex items-center gap-0.5 font-mono text-[11px] tabular-nums text-sky-700 dark:text-sky-400">
                <Droplets size={10} aria-hidden="true" />
                {item.precipitationProbability}%
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
