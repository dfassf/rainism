interface ModeTabsProps {
  mode: 'current' | 'route';
  onModeChange: (mode: 'current' | 'route') => void;
}

export function ModeTabs({ mode, onModeChange }: ModeTabsProps) {
  return (
    <div className="mode-tabs">
      <button
        className={`mode-tab ${mode === 'current' ? 'active' : ''}`}
        onClick={() => onModeChange('current')}
      >
        동네 외출
      </button>
      <button
        className={`mode-tab ${mode === 'route' ? 'active' : ''}`}
        onClick={() => onModeChange('route')}
      >
        장거리 외출
      </button>
    </div>
  );
}
