import {
  CityLocation,
  DailyForecastPoint,
  HourlyForecastPoint,
  WeatherData,
} from '../types/weather';

export const DEFAULT_CITIES: CityLocation[] = [
  {
    id: 'mx-cdmx',
    name: 'Ciudad de México',
    admin1: 'CDMX',
    country: 'México',
    latitude: 19.4326,
    longitude: -99.1332,
    timezone: 'America/Mexico_City',
  },
  {
    id: 'es-madrid',
    name: 'Madrid',
    admin1: 'Comunidad de Madrid',
    country: 'España',
    latitude: 40.4168,
    longitude: -3.7038,
    timezone: 'Europe/Madrid',
  },
  {
    id: 'ar-bue',
    name: 'Buenos Aires',
    admin1: 'Buenos Aires',
    country: 'Argentina',
    latitude: -34.6037,
    longitude: -58.3816,
    timezone: 'America/Argentina/Buenos_Aires',
  },
  {
    id: 'co-bog',
    name: 'Bogotá',
    admin1: 'Cundinamarca',
    country: 'Colombia',
    latitude: 4.711,
    longitude: -74.0721,
    timezone: 'America/Bogota',
  },
  {
    id: 'pe-lim',
    name: 'Lima',
    admin1: 'Lima',
    country: 'Perú',
    latitude: -12.0464,
    longitude: -77.0428,
    timezone: 'America/Lima',
  },
];

interface GeocodingApiResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  timezone?: string;
}

export async function searchCities(
  query: string,
  signal?: AbortSignal
): Promise<CityLocation[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', trimmed);
  url.searchParams.set('count', '6');
  url.searchParams.set('language', 'es');
  url.searchParams.set('format', 'json');

  const response = await fetch(url.toString(), { signal });
  if (!response.ok) {
    throw new Error('No se pudo buscar la ciudad en este momento.');
  }

  const data = (await response.json()) as { results?: GeocodingApiResult[] };
  if (!data.results || data.results.length === 0) return [];

  return data.results.map((item) => ({
    id: `om-${item.id}`,
    name: item.name,
    admin1: item.admin1,
    country: item.country ?? 'Mundo',
    latitude: item.latitude,
    longitude: item.longitude,
    timezone: item.timezone,
  }));
}

export async function reverseGeocodeCity(
  latitude: number,
  longitude: number
): Promise<CityLocation> {
  try {
    const url = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');
    url.searchParams.set('latitude', latitude.toString());
    url.searchParams.set('longitude', longitude.toString());
    url.searchParams.set('localityLanguage', 'es');

    const response = await fetch(url.toString());
    if (response.ok) {
      const data = (await response.json()) as {
        city?: string;
        locality?: string;
        principalSubdivision?: string;
        countryName?: string;
      };
      const name = data.city || data.locality || 'Mi ubicación';
      return {
        id: `geo-${latitude.toFixed(3)}-${longitude.toFixed(3)}`,
        name,
        admin1: data.principalSubdivision,
        country: data.countryName || 'Ubicación actual',
        latitude,
        longitude,
      };
    }
  } catch {
    // Fallback cleanly if reverse geocode fails
  }

  return {
    id: `geo-${latitude.toFixed(3)}-${longitude.toFixed(3)}`,
    name: 'Mi ubicación',
    country: `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`,
    latitude,
    longitude,
  };
}

function formatDayName(dateStr: string, index: number): { dayLabel: string; shortDate: string } {
  const [year, month, day] = dateStr.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  const shortDate = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(utcDate);

  if (index === 0) {
    return { dayLabel: 'Hoy', shortDate };
  }
  if (index === 1) {
    return { dayLabel: 'Mañana', shortDate };
  }

  const weekday = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    timeZone: 'UTC',
  }).format(utcDate);

  return {
    dayLabel: weekday.charAt(0).toUpperCase() + weekday.slice(1),
    shortDate,
  };
}

interface OpenMeteoForecastResponse {
  timezone: string;
  utc_offset_seconds: number;
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    is_day: number;
    precipitation: number;
    weather_code: number;
    cloud_cover: number;
    surface_pressure: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    weather_code: number[];
    is_day: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
    precipitation_probability_max: number[];
    wind_speed_10m_max: number[];
  };
}

export async function fetchWeatherForecast(
  location: CityLocation,
  signal?: AbortSignal
): Promise<WeatherData> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', location.latitude.toString());
  url.searchParams.set('longitude', location.longitude.toString());
  url.searchParams.set(
    'current',
    [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'is_day',
      'precipitation',
      'weather_code',
      'cloud_cover',
      'surface_pressure',
      'wind_speed_10m',
      'wind_direction_10m',
    ].join(',')
  );
  url.searchParams.set(
    'hourly',
    ['temperature_2m', 'precipitation_probability', 'weather_code', 'is_day'].join(',')
  );
  url.searchParams.set(
    'daily',
    [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'sunrise',
      'sunset',
      'uv_index_max',
      'precipitation_probability_max',
      'wind_speed_10m_max',
    ].join(',')
  );
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', '7');

  const response = await fetch(url.toString(), { signal });
  if (!response.ok) {
    throw new Error('No fue posible obtener el pronóstico del clima.');
  }

  const raw = (await response.json()) as OpenMeteoForecastResponse;

  const currentHourPrefix = raw.current.time.slice(0, 13);
  let startHourIndex = raw.hourly.time.findIndex((t) => t.startsWith(currentHourPrefix));
  if (startHourIndex < 0) startHourIndex = 0;

  const hourly: HourlyForecastPoint[] = raw.hourly.time
    .slice(startHourIndex, startHourIndex + 24)
    .map((time, idx) => {
      const i = startHourIndex + idx;
      const hhmm = time.split('T')[1]?.slice(0, 5) ?? '00:00';
      return {
        time,
        hourLabel: idx === 0 ? 'Ahora' : hhmm,
        temperature: raw.hourly.temperature_2m[i],
        precipitationProbability: raw.hourly.precipitation_probability[i] ?? 0,
        weatherCode: raw.hourly.weather_code[i],
        isDay: raw.hourly.is_day[i] === 1,
      };
    });

  const daily: DailyForecastPoint[] = raw.daily.time.map((date, i) => {
    const { dayLabel, shortDate } = formatDayName(date, i);
    return {
      date,
      dayLabel,
      shortDate,
      weatherCode: raw.daily.weather_code[i],
      temperatureMax: raw.daily.temperature_2m_max[i],
      temperatureMin: raw.daily.temperature_2m_min[i],
      sunrise: raw.daily.sunrise[i],
      sunset: raw.daily.sunset[i],
      uvIndexMax: raw.daily.uv_index_max[i] ?? 0,
      precipitationProbabilityMax: raw.daily.precipitation_probability_max[i] ?? 0,
      windSpeedMax: raw.daily.wind_speed_10m_max[i] ?? 0,
    };
  });

  return {
    location,
    timezone: raw.timezone,
    utcOffsetSeconds: raw.utc_offset_seconds,
    current: {
      time: raw.current.time,
      temperature: raw.current.temperature_2m,
      apparentTemperature: raw.current.apparent_temperature,
      humidity: raw.current.relative_humidity_2m,
      isDay: raw.current.is_day === 1,
      precipitation: raw.current.precipitation,
      weatherCode: raw.current.weather_code,
      cloudCover: raw.current.cloud_cover,
      surfacePressure: raw.current.surface_pressure,
      windSpeed: raw.current.wind_speed_10m,
      windDirection: raw.current.wind_direction_10m,
    },
    hourly,
    daily,
    fetchedAt: new Date().toISOString(),
  };
}
