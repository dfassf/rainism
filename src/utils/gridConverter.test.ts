import { describe, it, expect } from 'vitest';
import { convertToGridCoordinates } from './gridConverter';

describe('convertToGridCoordinates', () => {
  it('서울(37.5665, 126.9780)을 격자 좌표로 변환', () => {
    const result = convertToGridCoordinates(37.5665, 126.978);
    expect(result.nx).toBe(60);
    expect(result.ny).toBe(127);
  });

  it('부산(35.1796, 129.0756)을 격자 좌표로 변환', () => {
    const result = convertToGridCoordinates(35.1796, 129.0756);
    expect(result.nx).toBe(98);
    expect(result.ny).toBe(76);
  });

  it('제주(33.4996, 126.5312)을 격자 좌표로 변환', () => {
    const result = convertToGridCoordinates(33.4996, 126.5312);
    expect(result.nx).toBe(53);
    expect(result.ny).toBe(38);
  });

  it('반환값이 정수', () => {
    const result = convertToGridCoordinates(37.5, 127.0);
    expect(Number.isInteger(result.nx)).toBe(true);
    expect(Number.isInteger(result.ny)).toBe(true);
  });

  it('격자 좌표가 양수', () => {
    const result = convertToGridCoordinates(37.5665, 126.978);
    expect(result.nx).toBeGreaterThan(0);
    expect(result.ny).toBeGreaterThan(0);
  });
});
