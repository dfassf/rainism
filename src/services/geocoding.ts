/**
 * OSM Nominatim API를 사용한 주소 검색 서비스
 * 무료이며 승인 불필요
 */

export interface GeocodingResult {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

export class GeocodingService {
  private baseUrl = 'https://nominatim.openstreetmap.org';

  /**
   * 주소로 좌표 검색 (Geocoding)
   */
  async searchAddress(query: string): Promise<GeocodingResult[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/search?` +
          new URLSearchParams({
            q: query,
            format: 'json',
            addressdetails: '1',
            limit: '5',
            countrycodes: 'kr', // 한국 결과만
          }),
        {
          headers: {
            'User-Agent': 'Rainism/1.0', // Nominatim 정책: User-Agent 필수
          },
        }
      );

      if (!response.ok) {
        throw new Error('주소 검색에 실패했습니다.');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Geocoding error:', error);
      throw new Error('주소 검색 중 오류가 발생했습니다.');
    }
  }

  /**
   * 좌표로 주소 검색 (Reverse Geocoding)
   */
  async reverseGeocode(lat: number, lon: number): Promise<GeocodingResult | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/reverse?` +
          new URLSearchParams({
            lat: lat.toString(),
            lon: lon.toString(),
            format: 'json',
            addressdetails: '1',
          }),
        {
          headers: {
            'User-Agent': 'Rainism/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error('역지오코딩에 실패했습니다.');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }
}
