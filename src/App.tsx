import { useState, useEffect, useMemo } from 'react';
import { getCurrentLocation } from './utils/location';
import { convertToGridCoordinates } from './utils/gridConverter';
import { WeatherApiService } from './services/weatherApi';
import { RainfallForecast } from './types';
import { makeUmbrellaDecision, UmbrellaDecision } from './utils/umbrellaDecision';
import { RoutePlanner } from './components/RoutePlanner';
import './App.css';

function App() {
  const [, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [forecasts, setForecasts] = useState<RainfallForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [travelTime] = useState<number>(120); // 2시간 예보 전체 활용
  const [mode, setMode] = useState<'current' | 'route'>('current'); // 현재 위치 / 경로 모드

  useEffect(() => {
    // 환경 변수에서 API 키 가져오기
    const key = import.meta.env.VITE_WEATHER_API_KEY || '';
    if (key) {
      setApiKey(key);
    }
  }, []);

  useEffect(() => {
    if (apiKey) {
      loadWeatherData();
    }
  }, [apiKey]);

  const loadWeatherData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 현재 위치 가져오기
      const currentLocation = await getCurrentLocation();
      // getCurrentLocation은 { latitude, longitude }를 반환하므로
      // 컴포넌트에서 사용하는 { lat, lon } 형태로 변환
      setLocation({
        lat: currentLocation.latitude,
        lon: currentLocation.longitude,
      });

      // 격자 좌표로 변환
      const grid = convertToGridCoordinates(currentLocation.latitude, currentLocation.longitude);

      // API 서비스 초기화
      const weatherService = new WeatherApiService(apiKey);

      // 초단기강수예측 데이터 가져오기
      const items = await weatherService.getUltraShortRainfall(grid.nx, grid.ny);

      // 시간별로 데이터 그룹화
      const timeGroups = new Map<string, { RN1?: string; PTY?: string }>();
      
      items.forEach((item) => {
        if (item.category === 'RN1' || item.category === 'PTY') {
          const timeKey = `${item.fcstDate}-${item.fcstTime}`;
          if (!timeGroups.has(timeKey)) {
            timeGroups.set(timeKey, {});
          }
          const group = timeGroups.get(timeKey)!;
          if (item.category === 'RN1') {
            group.RN1 = item.fcstValue;
          } else if (item.category === 'PTY') {
            group.PTY = item.fcstValue;
          }
        }
      });

      // 데이터 가공 및 정렬
      const processedForecasts: RainfallForecast[] = Array.from(timeGroups.entries())
        .map(([timeKey, data]) => {
          const [date, time] = timeKey.split('-');
          const hour = time.substring(0, 2);
          const minute = time.substring(2, 4);
          const datetime = new Date(
            parseInt(date.substring(0, 4)),
            parseInt(date.substring(4, 6)) - 1,
            parseInt(date.substring(6, 8)),
            parseInt(hour),
            parseInt(minute)
          );

          const precipitation = parseFloat(data.RN1 || '0');
          const precipitationType = data.PTY
            ? weatherService.getPrecipitationType(data.PTY)
            : '없음';
          const needsUmbrella = Boolean(precipitation > 0 || (data.PTY && data.PTY !== '0'));

          return {
            time: `${hour}:${minute}`,
            precipitation,
            precipitationType,
            date,
            datetime,
            needsUmbrella,
          };
        })
        .sort((a, b) => a.datetime.getTime() - b.datetime.getTime())
        .filter((item) => item.datetime >= new Date()) // 현재 시간 이후만
        .slice(0, 12); // 최근 12개 표시

      setForecasts(processedForecasts);
    } catch (err) {
      setError(err instanceof Error ? err.message : '날씨 정보를 가져오는 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApiKeySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const key = formData.get('apiKey') as string;
    if (key) {
      setApiKey(key);
      localStorage.setItem('weather_api_key', key);
    }
  };

  useEffect(() => {
    // 로컬 스토리지에서 API 키 불러오기
    const savedKey = localStorage.getItem('weather_api_key');
    if (savedKey && !apiKey) {
      setApiKey(savedKey);
    }
  }, []);

  // 우산 결정 계산
  const decision: UmbrellaDecision | null = useMemo(() => {
    if (forecasts.length === 0) return null;
    return makeUmbrellaDecision(forecasts, travelTime);
  }, [forecasts, travelTime]);

  if (!apiKey) {
  return (
    <div className="app">
      <div className="container">
        <h1>Rainism</h1>
        <p className="subtitle">우산 결정 도우미</p>

        {/* 모드 전환 탭 */}
        <div className="mode-tabs">
          <button
            className={`mode-tab ${mode === 'current' ? 'active' : ''}`}
            onClick={() => setMode('current')}
          >
            동네 외출
          </button>
          <button
            className={`mode-tab ${mode === 'route' ? 'active' : ''}`}
            onClick={() => setMode('route')}
          >
            장거리 외출
          </button>
        </div>
          <form onSubmit={handleApiKeySubmit} className="api-key-form">
            <label htmlFor="apiKey">기상청 API 키를 입력하세요:</label>
            <input
              type="text"
              id="apiKey"
              name="apiKey"
              placeholder="기상청 API 서비스 키"
              required
              className="api-key-input"
            />
            <button type="submit" className="submit-button">
              시작하기
            </button>
          </form>
          <div className="info-box">
            <p>
              <strong>API 키 발급 방법:</strong>
            </p>
            <ol>
              <li>
                <a href="https://www.data.go.kr/" target="_blank" rel="noopener noreferrer">
                  공공데이터포털
                </a>
                에 접속
              </li>
              <li>"초단기예보 ((구)동네예보) 조회서비스" 검색</li>
              <li>활용신청 후 서비스 키 발급</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="container">
        <h1>Rainism</h1>
        <p className="subtitle">우산 결정 도우미</p>

        {/* 모드 전환 탭 */}
        <div className="mode-tabs">
          <button
            className={`mode-tab ${mode === 'current' ? 'active' : ''}`}
            onClick={() => setMode('current')}
          >
            동네 외출
          </button>
          <button
            className={`mode-tab ${mode === 'route' ? 'active' : ''}`}
            onClick={() => setMode('route')}
          >
            장거리 외출
          </button>
        </div>

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
            {/* 우산 결정 카드 - 핵심 UI */}
            {decision && (
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
            )}

            {/* 행동 기준 설명 */}
            {decision && (
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
            )}

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
