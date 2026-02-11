import { useState, useEffect } from 'react';
import { GeocodingService, GeocodingResult } from '../services/geocoding';
import './AddressSearch.css';

interface AddressSearchProps {
  onSelect: (result: { name: string; latitude: number; longitude: number }) => void;
  placeholder?: string;
}

export function AddressSearch({ onSelect, placeholder = '주소를 입력하세요' }: AddressSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const geocodingService = new GeocodingService();

  // 디바운스를 위한 타이머
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        const searchResults = await geocodingService.searchAddress(query);
        setResults(searchResults);
        setShowResults(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : '검색 중 오류가 발생했습니다.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms 디바운스

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (result: GeocodingResult) => {
    onSelect({
      name: result.display_name,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    });
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  return (
    <div className="address-search">
      <div className="search-input-wrapper">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="address-search-input"
          onFocus={() => setShowResults(true)}
        />
        {loading && <div className="search-loading">검색 중...</div>}
      </div>

      {error && <div className="search-error">{error}</div>}

      {showResults && results.length > 0 && (
        <div className="search-results">
          {results.map((result, index) => (
            <div
              key={index}
              className="search-result-item"
              onClick={() => handleSelect(result)}
            >
              <div className="result-name">
                {result.display_name}
              </div>
              {result.address?.road && (
                <div className="result-road">
                  {result.address.road}
                </div>
              )}
              <div className="result-address">
                {result.address?.city || ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && !loading && query.length >= 2 && (
        <div className="no-results">검색 결과가 없습니다.</div>
      )}
    </div>
  );
}
