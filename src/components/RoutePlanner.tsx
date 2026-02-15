import { useState, useEffect } from 'react';
import { RoutePoint, RouteSegment, RouteRainfallAnalysis } from '../types/route';
import { analyzeRouteRainfall } from '../utils/routeAnalysis';
import { PointInputCard } from './PointInputCard';
import { RouteMap } from './RouteMap';
import { getCurrentLocation } from '../utils/location';
import { GeocodingService } from '../services/geocoding';
import { formatRelativeTime } from '../utils/timeFormat';
import './RoutePlanner.css';

interface RoutePlannerProps {
  apiKey: string;
}

export function RoutePlanner({ apiKey }: RoutePlannerProps) {
  const [points, setPoints] = useState<RoutePoint[]>([]);
  const [, setSegments] = useState<RouteSegment[]>([]);
  const [analysis, setAnalysis] = useState<RouteRainfallAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // 컴포넌트 마운트 시 자동으로 출발지와 목적지 초기화
  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      initializeRoute();
    }
  }, [initialized]);

  // 출발지(현재 위치)와 목적지(빈 상태) 초기화
  const initializeRoute = async () => {
    setLoadingLocation(true);
    try {
      const currentLocation = await getCurrentLocation();
      const geocodingService = new GeocodingService();
      const address = await geocodingService.reverseGeocode(
        currentLocation.latitude,
        currentLocation.longitude
      );

      const startPoint: RoutePoint = {
        id: `point-start-${Date.now()}`,
        name: address?.display_name || '현재 위치',
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        type: 'start',
        order: 0,
      };

      const endPoint: RoutePoint = {
        id: `point-end-${Date.now()}`,
        name: '',
        latitude: 0,
        longitude: 0,
        type: 'destination',
        order: 1,
      };

      setPoints([startPoint, endPoint]);
    } catch (err) {
      console.error('현재 위치 가져오기 실패:', err);
      setError('현재 위치를 가져올 수 없습니다. 위치 권한을 확인해주세요.');

      const startPoint: RoutePoint = {
        id: `point-start-${Date.now()}`,
        name: '',
        latitude: 0,
        longitude: 0,
        type: 'start',
        order: 0,
      };

      const endPoint: RoutePoint = {
        id: `point-end-${Date.now()}`,
        name: '',
        latitude: 0,
        longitude: 0,
        type: 'destination',
        order: 1,
      };

      setPoints([startPoint, endPoint]);
    } finally {
      setLoadingLocation(false);
    }
  };

  // 경유지 추가 (출발지와 목적지 사이에 삽입)
  const addWaypoint = () => {
    const newWaypoint: RoutePoint = {
      id: `point-waypoint-${Date.now()}`,
      name: '',
      latitude: 0,
      longitude: 0,
      type: 'waypoint',
      order: points.length - 1,
    };

    const destination = points[points.length - 1];
    const otherPoints = points.slice(0, -1);
    const updatedPoints = [...otherPoints, newWaypoint, destination].map((p, idx) => ({
      ...p,
      order: idx,
    }));

    setPoints(updatedPoints);
  };

  // 지점 업데이트
  const updatePoint = (id: string, updates: Partial<RoutePoint>) => {
    setPoints((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  // 경유지 삭제 (출발지와 목적지는 삭제 불가)
  const removeWaypoint = (id: string) => {
    const updatedPoints = points
      .filter((p) => p.id !== id)
      .map((p, idx) => ({
        ...p,
        order: idx,
      }));
    setPoints(updatedPoints);
  };

  // 지도 우클릭으로 위치 설정
  const handleSetPoint = async (type: 'start' | 'destination' | 'waypoint', lat: number, lng: number) => {
    let addressName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    try {
      const geocodingService = new GeocodingService();
      const address = await geocodingService.reverseGeocode(lat, lng);
      if (address?.display_name) {
        addressName = address.display_name;
      }
    } catch {
      // 역지오코딩 실패 시 좌표 기반 이름 사용
    }

    if (type === 'waypoint') {
      // 경유지 추가
      const newWaypoint: RoutePoint = {
        id: `point-waypoint-${Date.now()}`,
        name: addressName,
        latitude: lat,
        longitude: lng,
        type: 'waypoint',
        order: points.length - 1,
      };
      const destination = points[points.length - 1];
      const otherPoints = points.slice(0, -1);
      setPoints([...otherPoints, newWaypoint, destination].map((p, idx) => ({
        ...p,
        order: idx,
      })));
    } else {
      // 출발지 또는 도착지 업데이트
      const target = points.find((p) => p.type === type);
      if (target) {
        updatePoint(target.id, { name: addressName, latitude: lat, longitude: lng });
      }
    }
  };

  // 모든 지점이 유효하면 자동 분석
  useEffect(() => {
    if (points.length < 2) return;

    const invalidPoints = points.filter(
      (p) => !p.name || p.latitude === 0 || p.longitude === 0
    );
    if (invalidPoints.length > 0) {
      setAnalysis(null);
      return;
    }

    const runAnalysis = async () => {
      const newSegments: RouteSegment[] = [];
      for (let i = 0; i < points.length - 1; i++) {
        newSegments.push({
          from: points[i],
          to: points[i + 1],
          estimatedTime: 60,
        });
      }
      setSegments(newSegments);

      try {
        setLoading(true);
        setError(null);
        const result = await analyzeRouteRainfall(points, newSegments, apiKey);
        setAnalysis(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : '경로 분석 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    runAnalysis();
  }, [points, apiKey]);

  return (
    <div className="route-planner">
      <h2>장거리 외출</h2>
      <p className="route-subtitle">
        출발지, 경유지, 목적지를 입력하고 각 구간에서 비가 올 시각을 확인하세요
      </p>
      <p className="data-source">
        ※ 기상청 초단기강수예측 데이터를 사용합니다
      </p>

      {/* 초기 로딩 상태 */}
      {loadingLocation && points.length === 0 && (
        <div className="initial-loading">
          <div className="loading-spinner"></div>
          <p>현재 위치를 확인하는 중...</p>
          <p className="loading-hint">위치 권한을 허용해주세요</p>
        </div>
      )}

      {/* 지도 표시 - 항상 표시, 우클릭으로 위치 선택 */}
      {points.length > 0 && (
        <>
          <RouteMap
            points={points}
            onSetPoint={handleSetPoint}
            rainSegments={
              analysis
                ? analysis.segments
                    .map((seg, idx) => (seg.rainDuringTravel ? idx : -1))
                    .filter((idx) => idx !== -1)
                : []
            }
            height="450px"
          />
          <p className="map-hint">지도를 우클릭하여 출발지/도착지/경유지를 설정할 수 있습니다</p>
        </>
      )}

      {/* 지점 입력 */}
      <div className="points-container">
        <div className="points-header">
          <h3>경로 지점</h3>
          <div className="point-buttons">
            <button
              onClick={addWaypoint}
              className="add-point-btn"
              disabled={loadingLocation}
            >
              + 경유지 추가
            </button>
          </div>
        </div>

        {points.map((point) => (
          <PointInputCard
            key={point.id}
            point={point}
            onUpdate={updatePoint}
            onRemove={point.type === 'waypoint' ? removeWaypoint : undefined}
          />
        ))}
      </div>

      {/* 분석 중 표시 */}
      {loading && (
        <div className="analyze-loading">분석 중...</div>
      )}

      {/* 오류 표시 */}
      {error && <div className="route-error">{error}</div>}

      {/* 분석 결과 */}
      {analysis && (
        <div className="analysis-result">
          <div className={`overall-decision decision-${analysis.overallDecision.needsUmbrella ? 'bring' : 'skip'}`}>
            <div className="decision-icon">
              {analysis.overallDecision.needsUmbrella ? '☂️' : '☀️'}
            </div>
            <div className="decision-content">
              <p>{analysis.overallDecision.message}</p>
            </div>
          </div>

          {/* 구간별 상세 정보 */}
          <div className="segments-detail">
            <h3>구간별 강수 예보</h3>
            {analysis.segments.map((segmentAnalysis, index) => (
              <div key={index} className="segment-card">
                <div className="segment-header">
                  <span className="segment-route">
                    {segmentAnalysis.segment.from.name} → {segmentAnalysis.segment.to.name}
                  </span>
                </div>

                {segmentAnalysis.rainDuringTravel ? (
                  <div className="segment-rain-warning">
                    <div className="rain-times">
                      <strong>비 예상:</strong>{' '}
                      {segmentAnalysis.rainTimes.map((t) => formatRelativeTime(t)).join(', ')}
                    </div>
                    <div className="rain-details">
                      <div>
                        <strong>{segmentAnalysis.segment.from.name}:</strong>{' '}
                        {segmentAnalysis.fromForecast.firstRainTime
                          ? `${formatRelativeTime(segmentAnalysis.fromForecast.firstRainTime)} 비 시작`
                          : '비 소식 없음'}
                      </div>
                      <div>
                        <strong>{segmentAnalysis.segment.to.name}:</strong>{' '}
                        {segmentAnalysis.toForecast.firstRainTime
                          ? `${formatRelativeTime(segmentAnalysis.toForecast.firstRainTime)} 비 시작`
                          : '비 소식 없음'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="segment-no-rain">비 소식 없음</div>
                )}
              </div>
            ))}
          </div>

          {/* 중요 지점 */}
          {analysis.overallDecision.criticalPoints.length > 0 && (
            <div className="critical-points">
              <h3>주의할 지점</h3>
              {analysis.overallDecision.criticalPoints.map((critical, index) => (
                <div key={index} className="critical-point-card">
                  <div className="critical-location">{critical.point.name}</div>
                  <div className="critical-time">{critical.rainTime}</div>
                  <div className="critical-message">{critical.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
