import { RoutePoint, RouteSegment, PointRainfallForecast, RouteRainfallAnalysis } from '../types/route';
import { convertToGridCoordinates } from './gridConverter';
import { WeatherApiService } from '../services/weatherApi';

/**
 * 경로 기반 강수 예보 분석 유틸리티
 */

/**
 * 지점별 강수 예보 조회
 */
export async function getPointRainfallForecast(
  point: RoutePoint,
  apiKey: string
): Promise<PointRainfallForecast> {
  const weatherService = new WeatherApiService(apiKey);
  const grid = convertToGridCoordinates(point.latitude, point.longitude);
  
  const items = await weatherService.getUltraShortRainfall(grid.nx, grid.ny);
  
  // 시간별로 데이터 그룹화
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

  // 데이터 가공
  const forecasts = Array.from(timeGroups.entries())
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

      return {
        time: `${hour}:${minute}`,
        datetime,
        precipitation: parseFloat(data.RN1 || '0'),
        precipitationType: data.PTY ? weatherService.getPrecipitationType(data.PTY) : '없음',
      };
    })
    .sort((a, b) => a.datetime.getTime() - b.datetime.getTime())
    .filter((item) => item.datetime >= new Date()) // 현재 시간 이후만
    .slice(0, 12); // 최근 12개

  const firstRain = forecasts.find((f) => f.precipitation > 0);
  const needsUmbrella = forecasts.some((f) => f.precipitation > 0);

  return {
    point,
    forecasts,
    firstRainTime: firstRain ? firstRain.time : null,
    needsUmbrella,
  };
}

/**
 * 경로 분석 (모든 지점의 강수 예보 조회)
 */
export async function analyzeRouteRainfall(
  points: RoutePoint[],
  segments: RouteSegment[],
  apiKey: string
): Promise<RouteRainfallAnalysis> {
  // 각 지점별 강수 예보 조회
  const pointForecasts = await Promise.all(
    points.map((point) => getPointRainfallForecast(point, apiKey))
  );

  // 구간별 분석
  const segmentAnalyses = segments.map((segment) => {
    const fromForecast = pointForecasts.find((pf) => pf.point.id === segment.from.id)!;
    const toForecast = pointForecasts.find((pf) => pf.point.id === segment.to.id)!;

    // 이동 중 강수 시각 계산
    const now = new Date();
    const segmentStartTime = now.getTime() + segment.estimatedTime * 60 * 1000; // 출발지 도착 예상 시간
    const segmentEndTime = segmentStartTime + segment.estimatedTime * 60 * 1000; // 목적지 도착 예상 시간

    // 출발지와 목적지의 강수 예보 중 이동 시간에 해당하는 것들
    const rainTimes: string[] = [];
    const allForecasts = [...fromForecast.forecasts, ...toForecast.forecasts];
    
    allForecasts.forEach((forecast) => {
      const forecastTime = forecast.datetime.getTime();
      if (
        forecastTime >= segmentStartTime &&
        forecastTime <= segmentEndTime &&
        forecast.precipitation > 0
      ) {
        if (!rainTimes.includes(forecast.time)) {
          rainTimes.push(forecast.time);
        }
      }
    });

    const rainDuringTravel = rainTimes.length > 0;

    return {
      segment,
      fromForecast,
      toForecast,
      rainDuringTravel,
      rainTimes: rainTimes.sort(),
    };
  });

  // 전체 판단
  const criticalPoints: Array<{
    point: RoutePoint;
    rainTime: string;
    message: string;
  }> = [];

  segmentAnalyses.forEach((analysis) => {
    if (analysis.rainDuringTravel) {
      analysis.rainTimes.forEach((rainTime) => {
        criticalPoints.push({
          point: analysis.segment.from,
          rainTime,
          message: `${analysis.segment.from.name} → ${analysis.segment.to.name} 구간에서 ${rainTime}에 비 예상`,
        });
      });
    }
  });

  const needsUmbrella = criticalPoints.length > 0;
  let message = '';
  
  if (needsUmbrella) {
    const firstCritical = criticalPoints[0];
    message = `${firstCritical.point.name}에서 ${firstCritical.rainTime}에 비가 올 예정입니다. 우산을 챙기세요.`;
  } else {
    message = '경로상 강수 예보가 없습니다. 우산 없이 이동 가능합니다.';
  }

  return {
    segments: segmentAnalyses,
    overallDecision: {
      needsUmbrella,
      message,
      criticalPoints,
    },
  };
}
