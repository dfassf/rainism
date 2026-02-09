# 🌧️ Rainism - 초단기강수예측 서비스

현재 위치 기반으로 한국 기상청 초단기강수예측 API를 사용하는 웹 애플리케이션입니다.

## 주요 기능

- 📍 현재 위치 자동 감지 (브라우저 Geolocation API)
- 🗺️ 위도/경도를 기상청 격자 좌표로 자동 변환
- 🌧️ 초단기강수예측 데이터 조회 및 표시
- 📱 반응형 디자인

## 기술 스택

- **React 18** - UI 라이브러리
- **TypeScript** - 타입 안정성
- **Vite** - 빌드 도구
- **Axios** - HTTP 클라이언트

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 기상청 API 키를 설정하세요:

```env
VITE_WEATHER_API_KEY=your_api_key_here
```

### 3. 기상청 API 키 발급 및 사용

1. [공공데이터포털](https://www.data.go.kr/) 접속
2. "기상청_단기예보 ((구)_동네예보) 조회서비스" 검색
3. 활용신청 후 서비스 키 발급
4. **중요**: 발급받은 **일반 인증키 (Decoding)** 값을 사용하세요
   - 예: `cuxo6vciSmMs/mDXCMQJIUupM0RpbC4sXOgYMIusI997pCgNjSaTdCv5ELeoMEZbQAt2F8KsRZc23w3ZiKadHg==`
   - Encoding된 키(`%2F` 같은 문자가 포함된)는 사용하지 마세요
5. 발급받은 Decoding 키를 `.env` 파일에 설정

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

### 5. 빌드

```bash
npm run build
```

## 사용 방법

1. 앱 실행 시 위치 권한 요청이 나타납니다. "허용"을 선택하세요.
2. 기상청 API 키가 설정되어 있으면 자동으로 현재 위치의 강수 예보를 표시합니다.
3. API 키가 없으면 화면에 입력 폼이 나타나며, 키를 입력하면 저장되어 다음부터 자동으로 사용됩니다.

## API 정보

- **서비스명**: 초단기예보 ((구)동네예보) 조회서비스
- **API 엔드포인트**: `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst`
- **데이터 갱신**: 매시간 30분에 생성, 10분마다 갱신
- **격자 해상도**: 5km × 5km

## 프로젝트 구조

```
rainism/
├── src/
│   ├── services/
│   │   └── weatherApi.ts      # 기상청 API 서비스
│   ├── utils/
│   │   ├── gridConverter.ts   # 격자 좌표 변환 유틸리티
│   │   └── location.ts        # 위치 정보 유틸리티
│   ├── types/
│   │   └── index.ts           # TypeScript 타입 정의
│   ├── App.tsx                # 메인 컴포넌트
│   ├── App.css                # 스타일
│   ├── main.tsx               # 진입점
│   └── index.css              # 전역 스타일
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 주의사항

- 브라우저의 위치 권한이 필요합니다.
- HTTPS 환경에서만 Geolocation API가 정상 작동합니다 (localhost는 예외).
- 기상청 API는 일일 호출 제한이 있을 수 있습니다.

## 라이선스

MIT
