import { RoutePoint } from '../types/route';
import { AddressSearch } from './AddressSearch';
import './PointInputCard.css';

interface PointInputCardProps {
  point: RoutePoint;
  onUpdate: (id: string, updates: Partial<RoutePoint>) => void;
  onRemove?: (id: string) => void;
}

const TYPE_LABELS: Record<RoutePoint['type'], string> = {
  start: '출발지',
  waypoint: '경유지',
  destination: '목적지',
};

export function PointInputCard({ point, onUpdate, onRemove }: PointInputCardProps) {
  const isSelected = point.name && point.latitude !== 0 && point.longitude !== 0;
  const label = TYPE_LABELS[point.type];

  return (
    <div className={`point-input-card point-card-${point.type}`}>
      <div className="point-header">
        <span className={`point-type-badge point-type-${point.type}`}>
          {label}
        </span>
        {point.type === 'waypoint' && onRemove && (
          <button onClick={() => onRemove(point.id)} className="remove-point-btn">
            삭제
          </button>
        )}
      </div>

      <div className="point-inputs">
        {isSelected ? (
          <div className="selected-location">
            <div className="selected-name">{point.name}</div>
            <button
              onClick={() => onUpdate(point.id, { name: '', latitude: 0, longitude: 0 })}
              className="clear-location-btn"
            >
              ✕
            </button>
          </div>
        ) : (
          <AddressSearch
            placeholder={`${label} 주소를 입력하세요 (예: 강남역)`}
            onSelect={(result) => {
              onUpdate(point.id, {
                name: result.name,
                latitude: result.latitude,
                longitude: result.longitude,
              });
            }}
          />
        )}
      </div>
    </div>
  );
}
