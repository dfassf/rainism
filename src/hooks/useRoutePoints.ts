import { useState, useEffect } from 'react';
import { RoutePoint } from '../types/route';
import { getCurrentLocation } from '../utils/location';
import { GeocodingService } from '../services/geocoding';

export function useRoutePoints() {
  const [points, setPoints] = useState<RoutePoint[]>([]);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      initializeRoute();
    }
  }, [initialized]);

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

  const addWaypoint = () => {
    const newWaypoint: RoutePoint = {
      id: `point-waypoint-${Date.now()}`,
      name: '',
      latitude: 0,
      longitude: 0,
      type: 'waypoint',
      order: points.length - 1,
    };

    const destination = points[points.length - 1];
    const otherPoints = points.slice(0, -1);
    const updatedPoints = [...otherPoints, newWaypoint, destination].map((p, idx) => ({
      ...p,
      order: idx,
    }));

    setPoints(updatedPoints);
  };

  const updatePoint = (id: string, updates: Partial<RoutePoint>) => {
    setPoints((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const removeWaypoint = (id: string) => {
    const updatedPoints = points
      .filter((p) => p.id !== id)
      .map((p, idx) => ({
        ...p,
        order: idx,
      }));
    setPoints(updatedPoints);
  };

  const handleSetPoint = async (type: 'start' | 'destination' | 'waypoint', lat: number, lng: number) => {
    let addressName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    try {
      const geocodingService = new GeocodingService();
      const address = await geocodingService.reverseGeocode(lat, lng);
      if (address?.display_name) {
        addressName = address.display_name;
      }
    } catch {
      // 역지오코딩 실패 시 좌표 기반 이름 사용
    }

    if (type === 'waypoint') {
      const newWaypoint: RoutePoint = {
        id: `point-waypoint-${Date.now()}`,
        name: addressName,
        latitude: lat,
        longitude: lng,
        type: 'waypoint',
        order: points.length - 1,
      };
      const destination = points[points.length - 1];
      const otherPoints = points.slice(0, -1);
      setPoints([...otherPoints, newWaypoint, destination].map((p, idx) => ({
        ...p,
        order: idx,
      })));
    } else {
      const target = points.find((p) => p.type === type);
      if (target) {
        updatePoint(target.id, { name: addressName, latitude: lat, longitude: lng });
      }
    }
  };

  return {
    points,
    loadingLocation,
    error,
    setError,
    addWaypoint,
    updatePoint,
    removeWaypoint,
    handleSetPoint,
  };
}
