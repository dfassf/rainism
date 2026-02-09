# Netlify 배포 가이드

## 1. Netlify CLI 설치 (선택사항)

```bash
npm install -g netlify-cli
```

## 2. Netlify 로그인

```bash
netlify login
```

## 3. 배포 방법

### 방법 1: Netlify 웹사이트에서 배포 (추천)

1. [Netlify](https://www.netlify.com/) 접속 및 로그인
2. "Add new site" → "Import an existing project" 클릭
3. GitHub 저장소 연결:
   - "GitHub" 선택
   - `dfassf/rainism` 저장소 선택
   - `shinwoo` 브랜치 선택 (또는 `main` 브랜치)
4. 빌드 설정:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. 환경 변수 설정:
   - "Site settings" → "Environment variables" 클릭
   - 다음 변수 추가:
     - `VITE_WEATHER_API_KEY`: 기상청 API 키 (Decoding된 키)
     - `VITE_KAKAO_MAP_API_KEY`: 카카오맵 API 키 (나중에 사용)
6. "Deploy site" 클릭

### 방법 2: Netlify CLI로 배포

```bash
# 프로젝트 디렉토리로 이동
cd /Users/test/Desktop/private_repo/rainism

# Netlify 초기화 (처음 한 번만)
netlify init

# 배포
netlify deploy --prod
```

### 방법 3: 드래그 앤 드롭

1. 프로젝트 빌드:
```bash
npm run build
```

2. [Netlify Drop](https://app.netlify.com/drop)에 `dist` 폴더를 드래그 앤 드롭

## 4. 환경 변수 설정

Netlify 대시보드에서 환경 변수를 설정해야 합니다:

1. Netlify 대시보드 → 사이트 선택
2. "Site settings" → "Environment variables"
3. 다음 변수 추가:
   - `VITE_WEATHER_API_KEY`: 기상청 API 키
   - `VITE_KAKAO_MAP_API_KEY`: 카카오맵 API 키 (선택사항)

## 5. 자동 배포 설정

GitHub 저장소와 연결하면:
- `shinwoo` 브랜치에 푸시할 때마다 자동으로 배포됩니다
- Pull Request 생성 시 미리보기 배포가 생성됩니다

## 6. 커스텀 도메인 설정 (선택사항)

1. Netlify 대시보드 → "Domain settings"
2. "Add custom domain" 클릭
3. 도메인 입력 및 DNS 설정

## 주의사항

- 환경 변수는 빌드 시점에 주입되므로, 변경 후 재배포가 필요합니다
- API 키는 절대 GitHub에 커밋하지 마세요 (`.env` 파일은 `.gitignore`에 포함됨)
- HTTPS는 Netlify에서 자동으로 제공됩니다

## 트러블슈팅

### 빌드 실패 시
- Netlify 빌드 로그 확인
- 로컬에서 `npm run build` 실행하여 오류 확인

### 환경 변수 미적용 시
- 환경 변수 설정 후 재배포 필요
- 변수명이 `VITE_`로 시작하는지 확인
