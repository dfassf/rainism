import { useEffect, useRef, useState, useCallback } from 'react';
import { RoutePoint } from '../types/route';
import { ensureKakaoLoaded } from '../services/geocoding';
import './RouteMap.css';

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  lat: number;
  lng: number;
}

interface RouteMapProps {
  points: RoutePoint[];
  rainSegments?: number[];
  height?: string;
  onSetPoint?: (type: 'start' | 'destination' | 'waypoint', lat: number, lng: number) => void;
}

export function RouteMap({ points, rainSegments = [], height = '400px', onSetPoint }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<kakao.maps.Map | null>(null);
  const markersRef = useRef<kakao.maps.Marker[]>([]);
  const polylinesRef = useRef<kakao.maps.Polyline[]>([]);
  const overlaysRef = useRef<kakao.maps.CustomOverlay[]>([]);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false, x: 0, y: 0, lat: 0, lng: 0,
  });

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  // 지도 초기화
  useEffect(() => {
    if (!mapRef.current) return;

    const initMap = () => {
      const validPoints = points.filter((p) => p.latitude !== 0 && p.longitude !== 0);

      const defaultCenter = validPoints.length > 0
        ? new kakao.maps.LatLng(validPoints[0].latitude, validPoints[0].longitude)
        : new kakao.maps.LatLng(37.5665, 126.978);

      const options: kakao.maps.MapOptions = {
        center: defaultCenter,
        level: validPoints.length <= 1 ? 5 : 7,
      };

      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new kakao.maps.Map(mapRef.current!, options);
      }

      if (validPoints.length > 0) {
        updateMapContent(validPoints);
      }
    };

    if (mapInstanceRef.current) {
      initMap();
    } else {
      ensureKakaoLoaded().then(initMap).catch(console.error);
    }
  }, [points, rainSegments]);

  // 우클릭 이벤트
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleRightClick = (mouseEvent: kakao.maps.event.MouseEvent) => {
      const latlng = mouseEvent.latLng;
      const projection = map.getProjection();
      const point = projection.containerPointFromCoords(latlng);
      setContextMenu({
        visible: true,
        x: point.x,
        y: point.y,
        lat: latlng.getLat(),
        lng: latlng.getLng(),
      });
    };

    const handleClick = () => {
      closeContextMenu();
    };

    kakao.maps.event.addListener(map, 'rightclick', handleRightClick);
    kakao.maps.event.addListener(map, 'click', handleClick);

    return () => {
      kakao.maps.event.removeListener(map, 'rightclick', handleRightClick);
      kakao.maps.event.removeListener(map, 'click', handleClick);
    };
  }, [closeContextMenu]);

  const handleContextSelect = (type: 'start' | 'destination' | 'waypoint') => {
    if (onSetPoint) {
      onSetPoint(type, contextMenu.lat, contextMenu.lng);
    }
    closeContextMenu();
  };

  const updateMapContent = (validPoints: RoutePoint[]) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.setMap(null));
    polylinesRef.current.forEach((p) => p.setMap(null));
    overlaysRef.current.forEach((o) => o.setMap(null));
    markersRef.current = [];
    polylinesRef.current = [];
    overlaysRef.current = [];

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
          strokeColor: isRain ? '#111111' : '#aaaaaa',
          strokeOpacity: isRain ? 0.9 : 0.6,
          strokeStyle: 'solid',
          map,
        });
        polylinesRef.current.push(polyline);
      }
    }

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

      {/* 우클릭 컨텍스트 메뉴 */}
      {contextMenu.visible && (
        <div
          className="map-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button onClick={() => handleContextSelect('start')}>출발지로 설정</button>
          <button onClick={() => handleContextSelect('destination')}>도착지로 설정</button>
          <button onClick={() => handleContextSelect('waypoint')}>경유지 추가</button>
        </div>
      )}

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
