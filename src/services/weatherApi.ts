import axios from 'axios';

/**
 * 기상청 초단기강수예측 API 응답 타입
 */
export interface UltraShortRainfallItem {
  baseDate: string; // 기준일
  baseTime: string; // 기준시
  category: string; // 자료구분코드
  fcstDate: string; // 예보일자
  fcstTime: string; // 예보시각
  fcstValue: string; // 예보 값
  nx: number; // X 좌표
  ny: number; // Y 좌표
}

export interface UltraShortRainfallResponse {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      dataType: string;
      items: {
        item: UltraShortRainfallItem[];
      };
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
}

/**
 * 기상청 초단기강수예측 API 서비스
 */
// 캐시 (격자+baseTime 기준, 10분 TTL)
const cache = new Map<string, { data: UltraShortRainfallItem[]; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10분

export class WeatherApiService {
  private readonly baseUrl = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst';
  private readonly serviceKey: string;

  constructor(serviceKey: string) {
    // Decoding된 키를 사용 (axios가 자동으로 인코딩함)
    this.serviceKey = serviceKey;
  }

  /**
   * 현재 시간 기준으로 초단기강수예측 데이터 조회
   * @param nx 격자 X 좌표
   * @param ny 격자 Y 좌표
   * @returns 초단기강수예측 데이터
   */
  async getUltraShortRainfall(nx: number, ny: number): Promise<UltraShortRainfallItem[]> {
    const now = new Date();
    const baseDate = this.formatDate(now);
    const baseTime = this.getBaseTime(now);
    const cacheKey = `${nx}:${ny}:${baseDate}:${baseTime}`;

    // 캐시 확인
    const cached = cache.get(cacheKey);
    if (cached && now.getTime() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    try {
      const response = await axios.get<UltraShortRainfallResponse>(this.baseUrl, {
        params: {
          serviceKey: this.serviceKey,
          pageNo: 1,
          numOfRows: 1000,
          dataType: 'JSON',
          base_date: baseDate,
          base_time: baseTime,
          nx: nx,
          ny: ny,
        },
      });

      if (response.data.response.header.resultCode !== '00') {
        throw new Error(
          `API 오류: ${response.data.response.header.resultMsg} (코드: ${response.data.response.header.resultCode})`
        );
      }

      const items = response.data.response.body.items.item || [];

      // 캐시 저장
      cache.set(cacheKey, { data: items, timestamp: now.getTime() });

      // 오래된 캐시 정리
      for (const [key, entry] of cache) {
        if (now.getTime() - entry.timestamp >= CACHE_TTL) {
          cache.delete(key);
        }
      }

      return items;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`API 요청 실패: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * 날짜를 YYYYMMDD 형식으로 변환
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * 현재 시간 기준으로 API 기준 시간 계산
   * 초단기예보는 매시간 30분에 생성되며, 10분마다 갱신됩니다.
   * 예: 14:30에 생성된 데이터는 14:40, 14:50, 15:00에 갱신
   */
  private getBaseTime(date: Date): string {
    const hour = date.getHours();
    const minute = date.getMinutes();

    // 매시간 30분에 생성되므로, 30분 이전이면 이전 시간의 데이터 사용
    let baseHour = hour;
    if (minute < 30) {
      baseHour = hour - 1;
      if (baseHour < 0) baseHour = 23;
    }

    // 10분 단위로 반올림 (예: 14:35 -> 14:30, 14:45 -> 14:40)
    const baseMinute = Math.floor(minute / 10) * 10;

    return `${String(baseHour).padStart(2, '0')}${String(baseMinute).padStart(2, '0')}`;
  }

  /**
   * 강수량 데이터만 필터링
   */
  filterRainfallData(items: UltraShortRainfallItem[]): UltraShortRainfallItem[] {
    return items.filter((item) => item.category === 'RN1' || item.category === 'PTY');
  }

  /**
   * 강수 형태 코드를 한글로 변환
   */
  getPrecipitationType(code: string): string {
    const types: Record<string, string> = {
      '0': '없음',
      '1': '비',
      '2': '비/눈',
      '3': '눈',
      '4': '소나기',
    };
    return types[code] || '알 수 없음';
  }
}
