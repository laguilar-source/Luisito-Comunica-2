import { TemperatureUnit } from '../types/weather';

export type WeatherCategory =
  | 'clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'storm';

export interface WeatherCodeInfo {
  label: string;
  category: WeatherCategory;
}

const WMO_CODES: Record<number, WeatherCodeInfo> = {
  0: { label: 'Cielo despejado', category: 'clear' },
  1: { label: 'Mayormente despejado', category: 'partly-cloudy' },
  2: { label: 'Parcialmente nublado', category: 'partly-cloudy' },
  3: { label: 'Nublado', category: 'cloudy' },
  45: { label: 'Niebla', category: 'fog' },
  48: { label: 'Niebla con escarcha', category: 'fog' },
  51: { label: 'Llovizna ligera', category: 'drizzle' },
  53: { label: 'Llovizna moderada', category: 'drizzle' },
  55: { label: 'Llovizna intensa', category: 'drizzle' },
  56: { label: 'Llovizna helada ligera', category: 'drizzle' },
  57: { label: 'Llovizna helada densa', category: 'drizzle' },
  61: { label: 'Lluvia ligera', category: 'rain' },
  63: { label: 'Lluvia moderada', category: 'rain' },
  65: { label: 'Lluvia fuerte', category: 'rain' },
  66: { label: 'Lluvia helada ligera', category: 'rain' },
  67: { label: 'Lluvia helada fuerte', category: 'rain' },
  71: { label: 'Nevada ligera', category: 'snow' },
  73: { label: 'Nevada moderada', category: 'snow' },
  75: { label: 'Nevada intensa', category: 'snow' },
  77: { label: 'Granos de nieve', category: 'snow' },
  80: { label: 'Chubascos ligeros', category: 'rain' },
  81: { label: 'Chubascos moderados', category: 'rain' },
  82: { label: 'Chubascos fuertes', category: 'rain' },
  85: { label: 'Chubascos de nieve ligeros', category: 'snow' },
  86: { label: 'Chubascos de nieve fuertes', category: 'snow' },
  95: { label: 'Tormenta eléctrica', category: 'storm' },
  96: { label: 'Tormenta con granizo ligero', category: 'storm' },
  99: { label: 'Tormenta con granizo fuerte', category: 'storm' },
};

export function getWeatherInfo(code: number): WeatherCodeInfo {
  return WMO_CODES[code] ?? { label: 'Condición variable', category: 'partly-cloudy' };
}

export function convertTemp(celsius: number, unit: TemperatureUnit): number {
  if (unit === 'fahrenheit') {
    return Math.round((celsius * 9) / 5 + 32);
  }
  return Math.round(celsius);
}

export function formatTemp(celsius: number, unit: TemperatureUnit): string {
  return `${convertTemp(celsius, unit)}°`;
}

export function getWindCardinal(degrees: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  const index = Math.round((((degrees % 360) + 360) % 360) / 45) % 8;
  return dirs[index];
}

export function getUvLabel(uv: number): string {
  if (uv < 3) return 'Bajo';
  if (uv < 6) return 'Moderado';
  if (uv < 8) return 'Alto';
  if (uv < 11) return 'Muy alto';
  return 'Extremo';
}

export function formatClockTime(isoDateTime: string): string {
  const timePart = isoDateTime.split('T')[1];
  if (!timePart) return '--:--';
  return timePart.slice(0, 5);
}

export function getWeatherAdvice(code: number, tempC: number, rainProb: number, uvMax: number): string {
  if (code >= 95) {
    return 'Se esperan tormentas eléctricas. Evita actividades al aire libre durante los picos de lluvia.';
  }
  if (rainProb >= 60 || (code >= 61 && code <= 82)) {
    return 'Alta probabilidad de lluvia hoy. Conviene llevar paraguas o impermeable al salir.';
  }
  if (tempC >= 30) {
    return 'Jornada calurosa. Mantente hidratado y procura sombra en las horas de mayor radiación.';
  }
  if (tempC <= 10) {
    return 'Ambiente frío. Se recomienda salir con abrigo ligero o chamarra térmica.';
  }
  if (uvMax >= 8) {
    return 'Radiación UV alta durante el mediodía. Usa protector solar si estarás bajo el sol.';
  }
  return 'Condiciones estables y agradables para actividades al aire libre.';
}
