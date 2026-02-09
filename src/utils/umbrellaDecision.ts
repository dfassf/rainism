import { RainfallForecast } from '../types';

/**
 * 우산 결정 도우미 유틸리티
 * "비 정보"가 아닌 "행동 기준"으로 판단
 */

export interface UmbrellaDecision {
  score: number; // 0~100 우산 지수
  recommendation: 'bring' | 'optional' | 'skip'; // bring: 챙기세요, optional: 선택, skip: 안 챙겨도 됨
  message: string; // 결정 문장
  icon: string; // 아이콘
  details: {
    willGetWet: boolean; // 안 들고 나가면 맞을 가능성
    isWasteful: boolean; // 들고 가면 헛수고일 가능성
    rainStartTime: number | null; // 강수 시작까지 남은 시간 (분)
    rainDuration: number; // 강수 지속 시간 (분)
    maxIntensity: number; // 최대 강수 강도 (mm)
  };
}

/**
 * 강수 강도 분류
 */
function getRainIntensity(precipitation: number): 'none' | 'light' | 'moderate' | 'heavy' {
  if (precipitation === 0) return 'none';
  if (precipitation < 1) return 'light'; // 1mm 미만: 약한 비
  if (precipitation < 5) return 'moderate'; // 1~5mm: 보통 비
  return 'heavy'; // 5mm 이상: 강한 비
}

/**
 * 시간 가중치 계산 (가까울수록 높은 가중치)
 */
function getTimeWeight(minutesFromNow: number): number {
  if (minutesFromNow <= 10) return 1.5; // 10분 이내: 최고 가중치
  if (minutesFromNow <= 20) return 1.2; // 20분 이내: 높은 가중치
  if (minutesFromNow <= 30) return 1.0; // 30분 이내: 기본 가중치
  if (minutesFromNow <= 60) return 0.7; // 60분 이내: 낮은 가중치
  return 0.3; // 60분 이후: 매우 낮은 가중치
}

/**
 * 강수 강도 가중치
 */
function getIntensityWeight(intensity: 'none' | 'light' | 'moderate' | 'heavy'): number {
  switch (intensity) {
    case 'heavy':
      return 1.5;
    case 'moderate':
      return 1.2;
    case 'light':
      return 0.8;
    case 'none':
      return 0;
  }
}

/**
 * 우산 지수 계산 (0~100)
 * = (강수확률 × 시간가중치 × 강수강도 가중치)의 합
 */
function calculateUmbrellaScore(
  forecasts: RainfallForecast[],
  travelTimeMinutes: number = 30
): number {
  const now = new Date();
  let totalScore = 0;

  // 이동 시간 내의 예보만 고려
  const relevantForecasts = forecasts.filter((f) => {
    const minutesFromNow = (f.datetime.getTime() - now.getTime()) / (1000 * 60);
    return minutesFromNow >= 0 && minutesFromNow <= travelTimeMinutes;
  });

  if (relevantForecasts.length === 0) return 0;

  relevantForecasts.forEach((forecast) => {
    const minutesFromNow = (forecast.datetime.getTime() - now.getTime()) / (1000 * 60);
    const intensity = getRainIntensity(forecast.precipitation);
    
    // 강수 확률 (0 또는 1, 강수량이 있으면 1)
    const probability = forecast.precipitation > 0 ? 1 : 0;
    
    // 시간 가중치
    const timeWeight = getTimeWeight(minutesFromNow);
    
    // 강도 가중치
    const intensityWeight = getIntensityWeight(intensity);
    
    // 점수 계산 (최대 100점)
    const score = probability * timeWeight * intensityWeight * 30; // 30은 스케일링 팩터
    totalScore += score;
  });

  return Math.min(Math.round(totalScore), 100);
}

/**
 * 우산 결정 생성
 */
export function makeUmbrellaDecision(
  forecasts: RainfallForecast[],
  travelTimeMinutes: number = 30
): UmbrellaDecision {
  const now = new Date();
  const score = calculateUmbrellaScore(forecasts, travelTimeMinutes);

  // 이동 시간 내의 강수 예보만 필터링
  const relevantForecasts = forecasts.filter((f) => {
    const minutesFromNow = (f.datetime.getTime() - now.getTime()) / (1000 * 60);
    return minutesFromNow >= 0 && minutesFromNow <= travelTimeMinutes && f.precipitation > 0;
  });

  // 강수 시작 시간 계산
  const firstRainForecast = relevantForecasts[0];
  const rainStartTime = firstRainForecast
    ? Math.round((firstRainForecast.datetime.getTime() - now.getTime()) / (1000 * 60))
    : null;

  // 강수 지속 시간 계산 (연속된 강수 구간)
  let rainDuration = 0;
  if (relevantForecasts.length > 0) {
    let consecutiveRain = 0;
    relevantForecasts.forEach((f, idx) => {
      const minutesFromNow = (f.datetime.getTime() - now.getTime()) / (1000 * 60);
      if (idx === 0 || minutesFromNow <= travelTimeMinutes) {
        consecutiveRain += 10; // 10분 단위
      }
    });
    rainDuration = consecutiveRain;
  }

  // 최대 강수 강도
  const maxIntensity =
    relevantForecasts.length > 0
      ? Math.max(...relevantForecasts.map((f) => f.precipitation))
      : 0;

  // 판단 로직
  // 1. 20분 이내 강수 시작
  // 2. 강수 지속 15분 이상
  // 3. 강수 강도 ≥ 보통 (1mm 이상)
  const hasRainWithin20Min = rainStartTime !== null && rainStartTime <= 20;
  const hasLongDuration = rainDuration >= 15;
  const hasModerateIntensity = maxIntensity >= 1;

  const willGetWet = hasRainWithin20Min || (hasLongDuration && hasModerateIntensity);
  const isWasteful = !willGetWet && score < 30; // 강수 가능성이 낮으면 헛수고

  // 결정 생성
  let recommendation: 'bring' | 'optional' | 'skip';
  let message: string;
  let icon: string;

  if (score >= 60 || willGetWet) {
    // 우산 챙기세요
    recommendation = 'bring';
    icon = '☂️';
    
    if (rainStartTime !== null && rainStartTime <= 20) {
      message = `지금 안 들고 나가면 ${rainStartTime}분 안에 비 맞을 확률이 높아요`;
    } else if (rainStartTime !== null) {
      message = `이동 시간 ${travelTimeMinutes}분 기준, 중간에 비 시작 예상`;
    } else {
      message = `이동 시간 동안 비가 올 예정입니다`;
    }
  } else if (score >= 30) {
    // 선택 영역
    recommendation = 'optional';
    icon = '🤷‍♂️';
    
    if (rainStartTime !== null && rainStartTime > 20) {
      message = `이동 후 비가 시작될 예정입니다. 선택하세요`;
    } else {
      message = `약한 비가 예상됩니다. 상황에 따라 결정하세요`;
    }
  } else {
    // 안 챙겨도 됨
    recommendation = 'skip';
    icon = '😌';
    
    if (rainStartTime !== null && rainStartTime > travelTimeMinutes) {
      message = `지금 비 구간은 이동 후에 시작됩니다`;
    } else {
      message = `이동 시간 동안 비 예보 없습니다`;
    }
  }

  return {
    score,
    recommendation,
    message,
    icon,
    details: {
      willGetWet,
      isWasteful,
      rainStartTime,
      rainDuration,
      maxIntensity,
    },
  };
}
