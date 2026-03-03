import { useState, useEffect } from 'react';
import { getCurrentLocation } from '../utils/location';
import { convertToGridCoordinates } from '../utils/gridConverter';
import { WeatherApiService } from '../services/weatherApi';
import { RainfallForecast } from '../types';

export function useWeatherData(apiKey: string) {
  const [forecasts, setForecasts] = useState<RainfallForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (apiKey) {
      loadWeatherData();
    }
  }, [apiKey]);

  const loadWeatherData = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentLocation = await getCurrentLocation();

      const grid = convertToGridCoordinates(currentLocation.latitude, currentLocation.longitude);

      const weatherService = new WeatherApiService(apiKey);

      const items = await weatherService.getUltraShortRainfall(grid.nx, grid.ny);

      const timeGroups = new Map<string, { RN1?: string; PTY?: string }>();

      items.forEach((item) => {
        if (item.category === 'RN1' || item.category === 'PTY') {
          const timeKey = `${item.fcstDate}-${item.fcstTime}`;
          if (!timeGroups.has(timeKey)) {
            timeGroups.set(timeKey, {});
          }
          const group = timeGroups.get(timeKey)!;
          if (item.category === 'RN1') {
            group.RN1 = item.fcstValue;
          } else if (item.category === 'PTY') {
            group.PTY = item.fcstValue;
          }
        }
      });

      const processedForecasts: RainfallForecast[] = Array.from(timeGroups.entries())
        .map(([timeKey, data]) => {
          const [date, time] = timeKey.split('-');
          const hour = time.substring(0, 2);
          const minute = time.substring(2, 4);
          const datetime = new Date(
            parseInt(date.substring(0, 4)),
            parseInt(date.substring(4, 6)) - 1,
            parseInt(date.substring(6, 8)),
            parseInt(hour),
            parseInt(minute)
          );

          const precipitation = parseFloat(data.RN1 || '0');
          const precipitationType = data.PTY
            ? weatherService.getPrecipitationType(data.PTY)
            : '없음';
          const needsUmbrella = Boolean(precipitation > 0 || (data.PTY && data.PTY !== '0'));

          return {
            time: `${hour}:${minute}`,
            precipitation,
            precipitationType,
            date,
            datetime,
            needsUmbrella,
          };
        })
        .sort((a, b) => a.datetime.getTime() - b.datetime.getTime())
        .filter((item) => item.datetime >= new Date())
        .slice(0, 12);

      setForecasts(processedForecasts);
    } catch (err) {
      setError(err instanceof Error ? err.message : '날씨 정보를 가져오는 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return { forecasts, loading, error, loadWeatherData };
}
