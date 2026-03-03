import { useState, useEffect } from 'react';
import { RoutePoint, RouteSegment, RouteRainfallAnalysis } from '../types/route';
import { analyzeRouteRainfall } from '../utils/routeAnalysis';

export function useRouteAnalysis(points: RoutePoint[], apiKey: string) {
  const [analysis, setAnalysis] = useState<RouteRainfallAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return { analysis, loading, error };
}
