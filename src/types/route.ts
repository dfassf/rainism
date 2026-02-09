/**
 * 경로 기반 강수 예보 타입
 */

export interface RoutePoint {
  id: string;
  name: string; // 지점 이름
  latitude: number;
  longitude: number;
  type: 'start' | 'waypoint' | 'destination'; // 출발지, 경유지, 목적지
  order: number; // 경로상 순서
}

export interface RouteSegment {
  from: RoutePoint;
  to: RoutePoint;
  estimatedTime: number; // 예상 소요 시간 (분)
  distance?: number; // 거리 (km) - 나중에 카카오맵 API로 계산
}

export interface PointRainfallForecast {
  point: RoutePoint;
  forecasts: {
    time: string; // 시각 (HH:mm)
    datetime: Date;
    precipitation: number; // 강수량 (mm)
    precipitationType: string; // 강수 형태
  }[];
  firstRainTime: string | null; // 첫 강수 시각
  needsUmbrella: boolean; // 우산 필요 여부
}

export interface RouteRainfallAnalysis {
  segments: {
    segment: RouteSegment;
    fromForecast: PointRainfallForecast;
    toForecast: PointRainfallForecast;
    rainDuringTravel: boolean; // 이동 중 강수 여부
    rainTimes: string[]; // 이동 중 강수 시각들
  }[];
  overallDecision: {
    needsUmbrella: boolean;
    message: string;
    criticalPoints: Array<{
      point: RoutePoint;
      rainTime: string;
      message: string;
    }>;
  };
}
