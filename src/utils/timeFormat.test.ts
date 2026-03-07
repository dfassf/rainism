import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatRelativeTime, formatMinutes } from './timeFormat';

describe('formatMinutes', () => {
  it('60분 미만이면 분 단위로 표시', () => {
    expect(formatMinutes(30)).toBe('30분');
    expect(formatMinutes(1)).toBe('1분');
    expect(formatMinutes(59)).toBe('59분');
  });

  it('정확히 60분이면 1시간', () => {
    expect(formatMinutes(60)).toBe('1시간');
  });

  it('60분 초과이면 시간+분 형식', () => {
    expect(formatMinutes(90)).toBe('1시간 30분');
    expect(formatMinutes(150)).toBe('2시간 30분');
  });

  it('정각이면 분 없이 표시', () => {
    expect(formatMinutes(120)).toBe('2시간');
    expect(formatMinutes(180)).toBe('3시간');
  });
});

describe('formatRelativeTime', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('60분 미만이면 N분 뒤 형식', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 7, 10, 0, 0));

    expect(formatRelativeTime('10:30')).toBe('30분 뒤');
    expect(formatRelativeTime('10:45')).toBe('45분 뒤');
  });

  it('60분 이상이면 시간+분 뒤 형식', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 7, 10, 0, 0));

    expect(formatRelativeTime('11:30')).toBe('1시간 30분 뒤');
    expect(formatRelativeTime('12:00')).toBe('2시간 뒤');
  });

  it('이미 지난 시각은 다음 날로 처리', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 7, 10, 0, 0));

    const result = formatRelativeTime('09:00');
    // 09:00은 이미 지났으므로 다음 날 09:00까지 = 23시간
    expect(result).toBe('23시간 뒤');
  });
});
