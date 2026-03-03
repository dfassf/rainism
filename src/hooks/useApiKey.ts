import { useState, useEffect } from 'react';

export function useApiKey() {
  const [apiKey, setApiKey] = useState<string>('');

  useEffect(() => {
    const key = import.meta.env.VITE_WEATHER_API_KEY || '';
    if (key) {
      setApiKey(key);
    }
  }, []);

  useEffect(() => {
    const savedKey = localStorage.getItem('weather_api_key');
    if (savedKey && !apiKey) {
      setApiKey(savedKey);
    }
  }, []);

  const handleApiKeySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const key = formData.get('apiKey') as string;
    if (key) {
      setApiKey(key);
      localStorage.setItem('weather_api_key', key);
    }
  };

  return { apiKey, handleApiKeySubmit };
}
