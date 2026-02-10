import { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import { RoutePoint } from '../types/route';
import 'leaflet/dist/leaflet.css';
import './RouteMap.css';

// Leaflet 기본 아이콘 문제 해결
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface RouteMapProps {
  points: RoutePoint[];
  rainSegments?: number[]; // 비가 오는 구간의 인덱스 배열
  height?: string;
}

// 지도 중심 자동 조정 컴포넌트
function MapBounds({ points }: { points: RoutePoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;

    const bounds = L.latLngBounds(
      points.map((p) => [p.latitude, p.longitude] as LatLngExpression)
    );

    // 지점이 1개만 있으면 클로즈업, 여러 개면 경로에 맞춰 조정
    if (points.length === 1) {
      map.setView([points[0].latitude, points[0].longitude], 15);
    } else {
      map.fitBounds(bounds, {
        padding: [30, 30],
        maxZoom: 14 // 너무 클로즈업되지 않도록
      });
    }
  }, [points, map]);

  return null;
}

export function RouteMap({ points, rainSegments = [], height = '400px' }: RouteMapProps) {
  if (points.length === 0) {
    return (
      <div className="route-map-empty" style={{ height }}>
        <p>경로 지점을 추가하면 지도가 표시됩니다</p>
      </div>
    );
  }

  // 기본 중심점 (첫 번째 지점 또는 서울)
  const center: LatLngExpression =
    points.length > 0 ? [points[0].latitude, points[0].longitude] : [37.5665, 126.978];

  // 지점이 1개면 더 클로즈업, 2개 이상이면 경로에 맞춰 조정
  const defaultZoom = points.length === 1 ? 15 : 13;

  return (
    <div className="route-map-container" style={{ height }}>
      <MapContainer
        center={center}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 경로 선 그리기 */}
        {points.length > 1 &&
          points.slice(0, -1).map((point, index) => {
            const nextPoint = points[index + 1];
            const positions: LatLngExpression[] = [
              [point.latitude, point.longitude],
              [nextPoint.latitude, nextPoint.longitude],
            ];

            // 비가 오는 구간은 빨간색, 아니면 토스 블루
            const isRainSegment = rainSegments.includes(index);
            const color = isRainSegment ? '#ff4444' : '#3182F6';
            const weight = isRainSegment ? 6 : 4;

            return (
              <Polyline
                key={`segment-${index}`}
                positions={positions}
                color={color}
                weight={weight}
                opacity={0.7}
              />
            );
          })}

        {/* 마커 표시 */}
        {points.map((point, index) => (
          <Marker key={point.id} position={[point.latitude, point.longitude]}>
            <Popup>
              <div className="marker-popup">
                <div className="popup-type">
                  {point.type === 'start' && '🚩 출발지'}
                  {point.type === 'waypoint' && '📍 경유지'}
                  {point.type === 'destination' && '🎯 목적지'}
                </div>
                <div className="popup-name">{point.name || `지점 ${index + 1}`}</div>
                <div className="popup-coords">
                  {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 지도 범위 자동 조정 */}
        <MapBounds points={points} />
      </MapContainer>

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
