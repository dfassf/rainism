/**
 * 카카오맵 API를 사용한 주소 검색 서비스
 */

/** kakao.maps.load()를 한 번만 호출하고 결과를 캐싱 */
let kakaoLoadPromise: Promise<void> | null = null;

export function ensureKakaoLoaded(): Promise<void> {
  if (kakaoLoadPromise) return kakaoLoadPromise;
  kakaoLoadPromise = new Promise((resolve, reject) => {
    if (typeof kakao === 'undefined') {
      reject(new Error('카카오맵 SDK가 로드되지 않았습니다. VITE_KAKAO_MAP_API_KEY를 확인해주세요.'));
      return;
    }
    kakao.maps.load(() => resolve());
  });
  return kakaoLoadPromise;
}

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
  private places: kakao.maps.services.Places | null = null;
  private geocoder: kakao.maps.services.Geocoder | null = null;

  private getPlaces(): kakao.maps.services.Places {
    if (!this.places) {
      this.places = new kakao.maps.services.Places();
    }
    return this.places;
  }

  private getGeocoder(): kakao.maps.services.Geocoder {
    if (!this.geocoder) {
      this.geocoder = new kakao.maps.services.Geocoder();
    }
    return this.geocoder;
  }

  /**
   * 키워드로 장소 검색 (카카오 Places)
   */
  async searchAddress(query: string): Promise<GeocodingResult[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    await ensureKakaoLoaded();

    return new Promise((resolve, reject) => {
      this.getPlaces().keywordSearch(
        query,
        (result, status) => {
          if (status === kakao.maps.services.Status.OK) {
            const mapped: GeocodingResult[] = result.map((item) => ({
              display_name: item.place_name,
              lat: item.y,
              lon: item.x,
              address: {
                road: item.road_address_name || undefined,
                city: item.address_name || undefined,
                country: '대한민국',
              },
            }));
            resolve(mapped);
          } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
            resolve([]);
          } else {
            reject(new Error('주소 검색 중 오류가 발생했습니다.'));
          }
        },
        { size: 5 }
      );
    });
  }

  /**
   * 좌표로 주소 검색 (카카오 Geocoder)
   */
  async reverseGeocode(lat: number, lon: number): Promise<GeocodingResult | null> {
    await ensureKakaoLoaded();

    return new Promise((resolve) => {
      this.getGeocoder().coord2Address(
        lon,
        lat,
        (result, status) => {
          if (status === kakao.maps.services.Status.OK && result.length > 0) {
            const item = result[0];
            const addressName =
              item.road_address?.address_name || item.address.address_name;
            resolve({
              display_name: addressName,
              lat: lat.toString(),
              lon: lon.toString(),
              address: {
                city: item.address.region_2depth_name,
                state: item.address.region_1depth_name,
                country: '대한민국',
              },
            });
          } else {
            resolve(null);
          }
        }
      );
    });
  }
}
