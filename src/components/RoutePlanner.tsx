import { useState, useEffect } from 'react';
import { RoutePoint, RouteSegment, RouteRainfallAnalysis } from '../types/route';
import { analyzeRouteRainfall } from '../utils/routeAnalysis';
import { AddressSearch } from './AddressSearch';
import { RouteMap } from './RouteMap';
import { getCurrentLocation } from '../utils/location';
import { GeocodingService } from '../services/geocoding';
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
  const [showCoordinates, setShowCoordinates] = useState(false);
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

      // 실패해도 빈 출발지와 목적지는 생성
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
      order: points.length - 1, // 목적지 바로 앞에 삽입
    };

    // 목적지를 제외한 모든 지점 + 새 경유지 + 목적지 순서로 재구성
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
    setPoints(points.map((p) => (p.id === id ? { ...p, ...updates } : p)));
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

  // 경로 분석 실행
  const analyzeRoute = async () => {
    if (points.length < 2) {
      setError('출발지와 목적지가 필요합니다.');
      return;
    }

    // 모든 지점에 이름과 좌표가 있는지 확인
    const invalidPoints = points.filter(
      (p) => !p.name || p.latitude === 0 || p.longitude === 0
    );
    if (invalidPoints.length > 0) {
      setError('모든 지점의 이름과 좌표를 입력해주세요.');
      return;
    }

    // 구간 생성
    const newSegments: RouteSegment[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      newSegments.push({
        from: points[i],
        to: points[i + 1],
        estimatedTime: 30, // 기본 30분 (나중에 카카오맵 API로 계산)
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

  return (
    <div className="route-planner">
      <h2>경로별 강수 예보</h2>
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
          <div key={point.id} className="point-input-card">
            <div className="point-header">
              <span className={`point-type-badge point-type-${point.type}`}>
                {point.type === 'start' && '출발지'}
                {point.type === 'waypoint' && '경유지'}
                {point.type === 'destination' && '목적지'}
              </span>
              {point.type === 'waypoint' && (
                <button onClick={() => removeWaypoint(point.id)} className="remove-point-btn">
                  삭제
                </button>
              )}
            </div>

            {/* 주소 검색 */}
            <div className="point-inputs">
              {point.name && point.latitude && point.longitude ? (
                <div className="selected-location">
                  <div className="selected-name">{point.name}</div>
                  <div className="selected-coords">
                    {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                  </div>
                  <button
                    onClick={() => updatePoint(point.id, { name: '', latitude: 0, longitude: 0 })}
                    className="change-location-btn"
                  >
                    변경
                  </button>
                </div>
              ) : (
                <AddressSearch
                  placeholder={`${
                    point.type === 'start'
                      ? '출발지'
                      : point.type === 'destination'
                      ? '목적지'
                      : '경유지'
                  } 주소를 입력하세요 (예: 강남역)`}
                  onSelect={(result) => {
                    updatePoint(point.id, {
                      name: result.name,
                      latitude: result.latitude,
                      longitude: result.longitude,
                    });
                  }}
                />
              )}
            </div>

            {/* 좌표 직접 입력 (고급 옵션) */}
            {!point.name && (
              <div className="advanced-options">
                <button
                  onClick={() => setShowCoordinates(!showCoordinates)}
                  className="toggle-coords-btn"
                >
                  {showCoordinates ? '좌표 입력 숨기기' : '좌표로 직접 입력'}
                </button>
                {showCoordinates && (
                  <div className="coordinate-inputs">
                    <input
                      type="number"
                      placeholder="위도"
                      step="0.0001"
                      value={point.latitude || ''}
                      onChange={(e) =>
                        updatePoint(point.id, { latitude: parseFloat(e.target.value) || 0 })
                      }
                      className="coordinate-input"
                    />
                    <input
                      type="number"
                      placeholder="경도"
                      step="0.0001"
                      value={point.longitude || ''}
                      onChange={(e) =>
                        updatePoint(point.id, { longitude: parseFloat(e.target.value) || 0 })
                      }
                      className="coordinate-input"
                    />
                    {point.latitude !== 0 && point.longitude !== 0 && (
                      <input
                        type="text"
                        placeholder="지점 이름 (선택)"
                        value={point.name}
                        onChange={(e) => updatePoint(point.id, { name: e.target.value })}
                        className="point-name-input"
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 분석 버튼 */}
      {points.length >= 2 && (
        <button onClick={analyzeRoute} className="analyze-btn" disabled={loading}>
          {loading ? '분석 중...' : '경로 분석하기'}
        </button>
      )}

      {/* 지도 표시 - 모든 지점이 유효한 좌표를 가지고 있을 때만 */}
      {points.length >= 2 &&
        points.every((p) => p.latitude !== 0 && p.longitude !== 0) && (
          <RouteMap
            points={points}
            rainSegments={
              analysis
                ? analysis.segments
                    .map((seg, idx) => (seg.rainDuringTravel ? idx : -1))
                    .filter((idx) => idx !== -1)
                : []
            }
            height="450px"
          />
        )}

      {/* 오류 표시 */}
      {error && <div className="route-error">{error}</div>}

      {/* 분석 결과 */}
      {analysis && (
        <div className="analysis-result">
          <div className={`overall-decision decision-${analysis.overallDecision.needsUmbrella ? 'bring' : 'skip'}`}>
            <div className="decision-icon">
              {analysis.overallDecision.needsUmbrella ? '' : ''}
            </div>
            <div className="decision-content">
              <h3>
                {analysis.overallDecision.needsUmbrella
                  ? '우산을 챙기세요'
                  : '우산 없이 이동 가능'}
              </h3>
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
                  <span className="segment-time">예상 소요: {segmentAnalysis.segment.estimatedTime}분</span>
                </div>

                {segmentAnalysis.rainDuringTravel ? (
                  <div className="segment-rain-warning">
                    <div className="rain-times">
                      <strong>비 예상 시각:</strong>{' '}
                      {segmentAnalysis.rainTimes.join(', ')}
                    </div>
                    <div className="rain-details">
                      <div>
                        <strong>출발지 ({segmentAnalysis.segment.from.name}):</strong>{' '}
                        {segmentAnalysis.fromForecast.firstRainTime
                          ? `${segmentAnalysis.fromForecast.firstRainTime}에 강수 시작`
                          : '강수 예보 없음'}
                      </div>
                      <div>
                        <strong>목적지 ({segmentAnalysis.segment.to.name}):</strong>{' '}
                        {segmentAnalysis.toForecast.firstRainTime
                          ? `${segmentAnalysis.toForecast.firstRainTime}에 강수 시작`
                          : '강수 예보 없음'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="segment-no-rain">이동 중 강수 예보 없음</div>
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
