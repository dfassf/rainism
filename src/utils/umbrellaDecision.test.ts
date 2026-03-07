import { describe, it, expect, vi, afterEach } from 'vitest';
import { makeUmbrellaDecision } from './umbrellaDecision';
import type { RainfallForecast } from '../types';

function createForecast(minutesFromNow: number, precipitation: number): RainfallForecast {
  const now = new Date();
  const datetime = new Date(now.getTime() + minutesFromNow * 60 * 1000);
  const hours = datetime.getHours().toString().padStart(2, '0');
  const mins = datetime.getMinutes().toString().padStart(2, '0');
  return {
    time: `${hours}:${mins}`,
    precipitation,
    precipitationType: precipitation > 0 ? '비' : '없음',
    date: datetime.toISOString().split('T')[0],
    datetime,
    needsUmbrella: precipitation > 0,
  };
}

describe('makeUmbrellaDecision', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('강수 예보 없으면 skip 추천', () => {
    const forecasts = [
      createForecast(10, 0),
      createForecast(20, 0),
      createForecast(30, 0),
    ];
    const result = makeUmbrellaDecision(forecasts, 30);
    expect(result.recommendation).toBe('skip');
    expect(result.score).toBe(0);
    expect(result.details.willGetWet).toBe(false);
  });

  it('10분 내 강한 비 예보면 bring 추천', () => {
    const forecasts = [
      createForecast(5, 5),
      createForecast(10, 3),
      createForecast(20, 2),
    ];
    const result = makeUmbrellaDecision(forecasts, 30);
    expect(result.recommendation).toBe('bring');
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.details.willGetWet).toBe(true);
  });

  it('20분 이내 강수 시작이면 willGetWet이 true', () => {
    const forecasts = [
      createForecast(15, 2),
      createForecast(25, 1),
    ];
    const result = makeUmbrellaDecision(forecasts, 30);
    expect(result.details.willGetWet).toBe(true);
    expect(result.details.rainStartTime).toBeLessThanOrEqual(20);
  });

  it('약한 비만 먼 시간에 예보되면 score가 낮음', () => {
    const forecasts = [
      createForecast(50, 0.5),
    ];
    const result = makeUmbrellaDecision(forecasts, 60);
    expect(result.score).toBeLessThan(60);
  });

  it('maxIntensity가 가장 높은 강수량과 일치', () => {
    const forecasts = [
      createForecast(5, 1),
      createForecast(10, 5),
      createForecast(20, 2),
    ];
    const result = makeUmbrellaDecision(forecasts, 30);
    expect(result.details.maxIntensity).toBe(5);
  });

  it('빈 배열이면 skip', () => {
    const result = makeUmbrellaDecision([], 30);
    expect(result.recommendation).toBe('skip');
    expect(result.score).toBe(0);
  });

  it('이동 시간 밖의 예보는 무시', () => {
    const forecasts = [
      createForecast(60, 10),
    ];
    const result = makeUmbrellaDecision(forecasts, 30);
    expect(result.score).toBe(0);
    expect(result.recommendation).toBe('skip');
  });
});
