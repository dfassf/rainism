interface ApiKeyFormProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function ApiKeyForm({ onSubmit }: ApiKeyFormProps) {
  return (
    <>
      <form onSubmit={onSubmit} className="api-key-form">
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
    </>
  );
}
