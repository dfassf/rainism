import { useEffect, useRef } from 'react';
import { RoutePoint } from '../types/route';
import { ensureKakaoLoaded } from '../services/geocoding';
import './RouteMap.css';

interface RouteMapProps {
  points: RoutePoint[];
  rainSegments?: number[]; // 비가 오는 구간의 인덱스 배열
  height?: string;
}

export function RouteMap({ points, rainSegments = [], height = '400px' }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<kakao.maps.Map | null>(null);
  const markersRef = useRef<kakao.maps.Marker[]>([]);
  const polylinesRef = useRef<kakao.maps.Polyline[]>([]);
  const overlaysRef = useRef<kakao.maps.CustomOverlay[]>([]);

  // 지도 초기화
  useEffect(() => {
    if (!mapRef.current || points.length === 0) return;

    const initMap = () => {
      const validPoints = points.filter((p) => p.latitude !== 0 && p.longitude !== 0);
      if (validPoints.length === 0) return;

      const center = new kakao.maps.LatLng(validPoints[0].latitude, validPoints[0].longitude);
      const options: kakao.maps.MapOptions = {
        center,
        level: validPoints.length === 1 ? 3 : 5,
      };

      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new kakao.maps.Map(mapRef.current!, options);
      } else {
        mapInstanceRef.current.setCenter(center);
      }

      updateMapContent(validPoints);
    };

    if (mapInstanceRef.current) {
      initMap();
    } else {
      ensureKakaoLoaded().then(initMap).catch(console.error);
    }
  }, [points, rainSegments]);

  const updateMapContent = (validPoints: RoutePoint[]) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // 기존 마커, 폴리라인, 오버레이 제거
    markersRef.current.forEach((m) => m.setMap(null));
    polylinesRef.current.forEach((p) => p.setMap(null));
    overlaysRef.current.forEach((o) => o.setMap(null));
    markersRef.current = [];
    polylinesRef.current = [];
    overlaysRef.current = [];

    // 마커 + 커스텀 오버레이 추가
    validPoints.forEach((point) => {
      const position = new kakao.maps.LatLng(point.latitude, point.longitude);

      const marker = new kakao.maps.Marker({ position, map });
      markersRef.current.push(marker);

      const typeLabel =
        point.type === 'start' ? '출발지' :
        point.type === 'waypoint' ? '경유지' : '목적지';

      const content = `
        <div class="kakao-info-window">
          <div class="info-type">${typeLabel}</div>
          <div class="info-name">${point.name || '지점'}</div>
        </div>
      `;

      const overlay = new kakao.maps.CustomOverlay({
        position,
        content,
        yAnchor: 2.2,
      });
      overlay.setMap(map);
      overlaysRef.current.push(overlay);
    });

    // 경로선 그리기
    if (validPoints.length > 1) {
      for (let i = 0; i < validPoints.length - 1; i++) {
        const from = validPoints[i];
        const to = validPoints[i + 1];
        const isRain = rainSegments.includes(i);

        const polyline = new kakao.maps.Polyline({
          path: [
            new kakao.maps.LatLng(from.latitude, from.longitude),
            new kakao.maps.LatLng(to.latitude, to.longitude),
          ],
          strokeWeight: isRain ? 6 : 4,
          strokeColor: isRain ? '#333333' : '#999999',
          strokeOpacity: 0.7,
          strokeStyle: 'solid',
          map,
        });
        polylinesRef.current.push(polyline);
      }
    }

    // 지도 범위 조정
    if (validPoints.length === 1) {
      map.setCenter(new kakao.maps.LatLng(validPoints[0].latitude, validPoints[0].longitude));
      map.setLevel(3);
    } else {
      const bounds = new kakao.maps.LatLngBounds();
      validPoints.forEach((p) => {
        bounds.extend(new kakao.maps.LatLng(p.latitude, p.longitude));
      });
      map.setBounds(bounds, 50, 50, 50, 50);
    }
  };

  if (points.length === 0) {
    return (
      <div className="route-map-empty" style={{ height }}>
        <p>경로 지점을 추가하면 지도가 표시됩니다</p>
      </div>
    );
  }

  return (
    <div className="route-map-container" style={{ height }}>
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />

      {/* 범례 */}
      <div className="map-legend">
        <div className="legend-item">
          <div className="legend-line legend-safe"></div>
          <span>안전 구간</span>
        </div>
        <div className="legend-item">
          <div className="legend-line legend-rain"></div>
          <span>강수 예상 구간</span>
        </div>
      </div>
    </div>
  );
}
