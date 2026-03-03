import { useState, useMemo } from 'react';
import { makeUmbrellaDecision } from './utils/umbrellaDecision';
import { useApiKey } from './hooks/useApiKey';
import { useWeatherData } from './hooks/useWeatherData';
import { RoutePlanner } from './components/RoutePlanner';
import { ModeTabs } from './components/ModeTabs';
import { ApiKeyForm } from './components/ApiKeyForm';
import { WeatherDecisionCard } from './components/WeatherDecisionCard';
import './App.css';

function App() {
  const { apiKey, handleApiKeySubmit } = useApiKey();
  const { forecasts, loading, error, loadWeatherData } = useWeatherData(apiKey);
  const [travelTime] = useState<number>(120);
  const [mode, setMode] = useState<'current' | 'route'>('current');

  const decision = useMemo(() => {
    if (forecasts.length === 0) return null;
    return makeUmbrellaDecision(forecasts, travelTime);
  }, [forecasts, travelTime]);

  if (!apiKey) {
    return (
      <div className="app">
        <div className="container">
          <h1>Rainism</h1>
          <p className="subtitle">우산 결정 도우미</p>
          <ModeTabs mode={mode} onModeChange={setMode} />
          <ApiKeyForm onSubmit={handleApiKeySubmit} />
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="container">
        <h1>Rainism</h1>
        <p className="subtitle">우산 결정 도우미</p>
        <ModeTabs mode={mode} onModeChange={setMode} />

        {loading ? (
          <div className="loading">날씨 정보를 불러오는 중...</div>
        ) : error ? (
          <div className="error">
            <p>{error}</p>
            <button onClick={loadWeatherData} className="retry-button">
              다시 시도
            </button>
          </div>
        ) : (
          <>
            {mode === 'route' ? (
              <RoutePlanner apiKey={apiKey} />
            ) : (
              <>
                {decision && <WeatherDecisionCard decision={decision} />}

                {!decision && forecasts.length === 0 && (
                  <div className="no-data">예보 데이터를 불러오는 중...</div>
                )}

                <button onClick={loadWeatherData} className="refresh-button">
                  새로고침
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
