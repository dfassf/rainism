# 카카오맵 API 연동 TODO

## 현재 상태
- ✅ 좌표 기반 경로 입력 및 강수 예보 분석 완료
- ⏳ 카카오맵 API 연동 대기 중

## 구현 예정 기능

### 1. 주소 검색 기능
- 사용자가 지점 이름으로 주소를 검색하면 자동으로 좌표 변환
- 카카오맵 API: `주소 검색 (좌표계 변환)` API 사용
- API 키: `VITE_KAKAO_MAP_API_KEY` 환경 변수 사용

### 2. 경로 탐색 및 소요 시간 계산
- 출발지 → 경유지 → 목적지 경로 탐색
- 카카오맵 API: `길찾기` API 사용
- 각 구간별 실제 소요 시간 계산
- 거리 계산

### 3. 지도 표시
- 경로를 지도에 표시
- 각 지점별 강수 예보를 마커로 표시
- 비가 올 구간을 시각적으로 강조

## 필요한 API 키
```env
VITE_KAKAO_MAP_API_KEY=your_kakao_map_api_key
```

## 참고 문서
- [카카오맵 API 가이드](https://apis.map.kakao.com/)
- [주소 검색 API](https://developers.kakao.com/docs/latest/ko/local/dev-guide#search-by-keyword)
- [길찾기 API](https://developers.kakao.com/docs/latest/ko/local/dev-guide#search-direction)

## 구현 시 수정할 파일
1. `src/components/RoutePlanner.tsx` - 주소 검색 UI 추가
2. `src/services/kakaoMapApi.ts` - 카카오맵 API 서비스 (신규 생성)
3. `src/utils/routeAnalysis.ts` - 실제 소요 시간 계산 로직 수정
