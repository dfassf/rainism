export interface RainfallForecast {
  time: string;
  precipitation: number; // 강수량 (mm) - 숫자로 변경
  precipitationType: string; // 강수 형태
  date: string;
  datetime: Date; // 정렬을 위한 날짜/시간
  needsUmbrella: boolean; // 우산 필요 여부
}

export interface LocationState {
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
  error: string | null;
}

export interface RainfallSummary {
  nextRainTime: string | null; // 다음 강수 예상 시간
  totalRainfall: number; // 총 강수량
  maxRainfall: number; // 최대 강수량
  hasRain: boolean; // 강수 여부
  rainDuration: number; // 강수 지속 시간 (분)
}

export interface UmbrellaDecision {
  score: number; // 0~100 우산 지수
  recommendation: 'bring' | 'optional' | 'skip';
  message: string;
  icon: string;
  details: {
    willGetWet: boolean;
    isWasteful: boolean;
    rainStartTime: number | null;
    rainDuration: number;
    maxIntensity: number;
  };
}
