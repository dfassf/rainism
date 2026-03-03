import { useRoutePoints } from '../hooks/useRoutePoints';
import { useRouteAnalysis } from '../hooks/useRouteAnalysis';
import { PointInputCard } from './PointInputCard';
import { RouteMap } from './RouteMap';
import { RouteAnalysisResult } from './RouteAnalysisResult';
import './RoutePlanner.css';

interface RoutePlannerProps {
  apiKey: string;
}

export function RoutePlanner({ apiKey }: RoutePlannerProps) {
  const {
    points,
    loadingLocation,
    error: pointsError,
    addWaypoint,
    updatePoint,
    removeWaypoint,
    handleSetPoint,
  } = useRoutePoints();

  const { analysis, loading, error: analysisError } = useRouteAnalysis(points, apiKey);

  const error = pointsError || analysisError;

  return (
    <div className="route-planner">
      <h2>장거리 외출</h2>
      <p className="route-subtitle">
        출발지, 경유지, 목적지를 입력하고 각 구간에서 비가 올 시각을 확인하세요
      </p>
      <p className="data-source">
        ※ 기상청 초단기강수예측 데이터를 사용합니다
      </p>

      {loadingLocation && points.length === 0 && (
        <div className="initial-loading">
          <div className="loading-spinner"></div>
          <p>현재 위치를 확인하는 중...</p>
          <p className="loading-hint">위치 권한을 허용해주세요</p>
        </div>
      )}

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

      {loading && (
        <div className="analyze-loading">분석 중...</div>
      )}

      {error && <div className="route-error">{error}</div>}

      {analysis && <RouteAnalysisResult analysis={analysis} />}
    </div>
  );
}
