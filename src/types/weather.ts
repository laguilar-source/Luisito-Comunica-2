export type TemperatureUnit = 'celsius' | 'fahrenheit';

export interface CityLocation {
  id: string;
  name: string;
  admin1?: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export interface CurrentWeather {
  time: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  isDay: boolean;
  precipitation: number;
  weatherCode: number;
  cloudCover: number;
  surfacePressure: number;
  windSpeed: number;
  windDirection: number;
}

export interface HourlyForecastPoint {
  time: string;
  hourLabel: string;
  temperature: number;
  precipitationProbability: number;
  weatherCode: number;
  isDay: boolean;
}

export interface DailyForecastPoint {
  date: string;
  dayLabel: string;
  shortDate: string;
  weatherCode: number;
  temperatureMax: number;
  temperatureMin: number;
  sunrise: string;
  sunset: string;
  uvIndexMax: number;
  precipitationProbabilityMax: number;
  windSpeedMax: number;
}

export interface WeatherData {
  location: CityLocation;
  timezone: string;
  utcOffsetSeconds: number;
  current: CurrentWeather;
  hourly: HourlyForecastPoint[];
  daily: DailyForecastPoint[];
  fetchedAt: string;
}
