import { UmbrellaDecision } from '../utils/umbrellaDecision';

interface WeatherDecisionCardProps {
  decision: UmbrellaDecision;
}

export function WeatherDecisionCard({ decision }: WeatherDecisionCardProps) {
  return (
    <>
      <div className={`decision-card decision-${decision.recommendation}`}>
        <div className="decision-icon">
          {decision.recommendation === 'bring' && '☂️'}
          {decision.recommendation === 'maybe' && '🌂'}
          {decision.recommendation === 'skip' && '☀️'}
        </div>
        <div className="decision-content">
          <div className="decision-message">{decision.message}</div>

          {decision.details.rainStartTime !== null && (
            <div className="decision-details">
              {decision.details.rainStartTime > 0 && (
                <div className="detail-item">
                  {decision.details.rainStartTime}분 뒤에 비 시작
                </div>
              )}
              {decision.details.rainDuration > 0 && (
                <div className="detail-item">
                  약 {decision.details.rainDuration}분 동안 비 예상
                </div>
              )}
              {decision.details.maxIntensity > 0 && (
                <div className="detail-item">
                  최대 강수량 {decision.details.maxIntensity.toFixed(1)}mm
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="action-explanation">
        <div className="explanation-content">
          {decision.details.willGetWet ? (
            <p>안 들고 나가면 비 맞을 가능성이 높아요</p>
          ) : decision.details.isWasteful ? (
            <p>들고 가면 헛수고일 수 있어요</p>
          ) : (
            <p>당분간 비 소식 없어요</p>
          )}
        </div>
      </div>
    </>
  );
}
