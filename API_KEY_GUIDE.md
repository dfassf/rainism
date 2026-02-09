# API 키 사용 가이드

## 어떤 키를 사용해야 하나요?

공공데이터포털에서 발급받은 API 키는 두 가지 형태로 제공됩니다:

1. **일반 인증키 (Encoding)** - URL 인코딩된 형태
   - 예: `cuxo6vciSmMs%2FmDXCMQJIUupM0RpbC4sXOgYMIusI997pCgNjSaTdCv5ELeoMEZbQAt2F8KsRZc23w3ZiKadHg%3D%3D`
   - `%2F`, `%3D` 같은 인코딩 문자 포함

2. **일반 인증키 (Decoding)** - 실제 키 값
   - 예: `cuxo6vciSmMs/mDXCMQJIUupM0RpbC4sXOgYMIusI997pCgNjSaTdCv5ELeoMEZbQAt2F8KsRZc23w3ZiKadHg==`
   - `/`, `=` 같은 일반 문자 포함

## ✅ 올바른 사용법

**Decoding된 키를 사용하세요!**

이 프로젝트는 axios를 사용하여 API를 호출하는데, axios의 `params` 옵션을 사용하면 자동으로 URL 인코딩이 됩니다. 따라서 Decoding된 키를 입력하면 자동으로 올바르게 인코딩되어 전송됩니다.

## 설정 방법

`.env` 파일에 다음과 같이 설정하세요:

```env
VITE_WEATHER_API_KEY=cuxo6vciSmMs/mDXCMQJIUupM0RpbC4sXOgYMIusI997pCgNjSaTdCv5ELeoMEZbQAt2F8KsRZc23w3ZiKadHg==
```

또는 앱 실행 후 화면에 나타나는 입력 폼에 Decoding된 키를 입력하세요.

## 주의사항

- ❌ Encoding된 키를 직접 사용하지 마세요 (이중 인코딩 문제 발생)
- ✅ Decoding된 키를 사용하세요 (axios가 자동으로 인코딩함)
