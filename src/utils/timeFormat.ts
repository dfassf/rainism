/**
 * 절대 시간(HH:mm)을 현재 기준 상대 시간 문자열로 변환
 */
export function formatRelativeTime(absoluteTime: string): string {
  const [hours, minutes] = absoluteTime.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);

  // 이미 지난 시각이면 다음 날로 처리
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  const diffMin = Math.round((target.getTime() - now.getTime()) / (1000 * 60));

  if (diffMin < 60) {
    return `${diffMin}분 뒤`;
  }
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return m > 0 ? `${h}시간 ${m}분 뒤` : `${h}시간 뒤`;
}

/**
 * 분 단위 숫자를 자연스러운 시간 문자열로 변환
 */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}분`;
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
}
