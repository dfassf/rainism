import { RouteRainfallAnalysis } from '../types/route';
import { formatRelativeTime } from '../utils/timeFormat';

interface RouteAnalysisResultProps {
  analysis: RouteRainfallAnalysis;
}

export function RouteAnalysisResult({ analysis }: RouteAnalysisResultProps) {
  return (
    <div className="analysis-result">
      <div className={`overall-decision decision-${analysis.overallDecision.needsUmbrella ? 'bring' : 'skip'}`}>
        <div className="decision-icon">
          {analysis.overallDecision.needsUmbrella ? '☂️' : '☀️'}
        </div>
        <div className="decision-content">
          <p>{analysis.overallDecision.message}</p>
        </div>
      </div>

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
  );
}
