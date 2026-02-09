import { useState } from 'react';
import { RoutePoint, RouteSegment, RouteRainfallAnalysis } from '../types/route';
import { analyzeRouteRainfall } from '../utils/routeAnalysis';
import './RoutePlanner.css';

interface RoutePlannerProps {
  apiKey: string;
}

export function RoutePlanner({ apiKey }: RoutePlannerProps) {
  const [points, setPoints] = useState<RoutePoint[]>([]);
  const [segments, setSegments] = useState<RouteSegment[]>([]);
  const [analysis, setAnalysis] = useState<RouteRainfallAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 새 지점 추가
  const addPoint = (type: 'start' | 'waypoint' | 'destination') => {
    const newPoint: RoutePoint = {
      id: `point-${Date.now()}`,
      name: '',
      latitude: 0,
      longitude: 0,
      type,
      order: points.length,
    };
    setPoints([...points, newPoint]);
  };

  // 지점 업데이트
  const updatePoint = (id: string, updates: Partial<RoutePoint>) => {
    setPoints(points.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  // 지점 삭제
  const removePoint = (id: string) => {
    setPoints(points.filter((p) => p.id !== id));
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
      <h2>📍 경로별 강수 예보</h2>
      <p className="route-subtitle">
        출발지, 경유지, 목적지를 입력하고 각 구간에서 비가 올 시각을 확인하세요
      </p>

      {/* 지점 입력 */}
      <div className="points-container">
        <div className="points-header">
          <h3>경로 지점</h3>
          <div className="point-buttons">
            <button onClick={() => addPoint('start')} className="add-point-btn">
              + 출발지
            </button>
            <button onClick={() => addPoint('waypoint')} className="add-point-btn">
              + 경유지
            </button>
            <button onClick={() => addPoint('destination')} className="add-point-btn">
              + 목적지
            </button>
          </div>
        </div>

        {points.map((point, index) => (
          <div key={point.id} className="point-input-card">
            <div className="point-header">
              <span className={`point-type-badge point-type-${point.type}`}>
                {point.type === 'start' && '🚩 출발지'}
                {point.type === 'waypoint' && '📍 경유지'}
                {point.type === 'destination' && '🎯 목적지'}
              </span>
              {points.length > 2 && point.type === 'waypoint' && (
                <button onClick={() => removePoint(point.id)} className="remove-point-btn">
                  삭제
                </button>
              )}
            </div>
            <div className="point-inputs">
              <input
                type="text"
                placeholder="지점 이름 (예: 강남역)"
                value={point.name}
                onChange={(e) => updatePoint(point.id, { name: e.target.value })}
                className="point-name-input"
              />
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
              </div>
            </div>
            <div className="point-note">
              💡 나중에 카카오맵 API로 주소 검색 가능 (현재는 좌표 직접 입력)
            </div>
          </div>
        ))}
      </div>

      {/* 분석 버튼 */}
      {points.length >= 2 && (
        <button onClick={analyzeRoute} className="analyze-btn" disabled={loading}>
          {loading ? '분석 중...' : '🔍 경로 분석하기'}
        </button>
      )}

      {/* 오류 표시 */}
      {error && <div className="route-error">❌ {error}</div>}

      {/* 분석 결과 */}
      {analysis && (
        <div className="analysis-result">
          <div className={`overall-decision decision-${analysis.overallDecision.needsUmbrella ? 'bring' : 'skip'}`}>
            <div className="decision-icon">
              {analysis.overallDecision.needsUmbrella ? '☂️' : '😌'}
            </div>
            <div className="decision-content">
              <h3>
                {analysis.overallDecision.needsUmbrella
                  ? '☂️ 우산을 챙기세요'
                  : '😌 우산 없이 이동 가능'}
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
                      ⚠️ <strong>비 예상 시각:</strong>{' '}
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
                  <div className="segment-no-rain">✅ 이동 중 강수 예보 없음</div>
                )}
              </div>
            ))}
          </div>

          {/* 중요 지점 */}
          {analysis.overallDecision.criticalPoints.length > 0 && (
            <div className="critical-points">
              <h3>⚠️ 주의할 지점</h3>
              {analysis.overallDecision.criticalPoints.map((critical, index) => (
                <div key={index} className="critical-point-card">
                  <div className="critical-location">📍 {critical.point.name}</div>
                  <div className="critical-time">⏰ {critical.rainTime}</div>
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
