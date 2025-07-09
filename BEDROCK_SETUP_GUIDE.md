# Amazon Bedrock 설정 가이드

## 🎯 개요

AWS Demo Factory에서 AI 기반 PDF 리포트 생성을 위해 Amazon Bedrock의 Claude 3.5 Sonnet 모델을 사용합니다.

## 🔧 필요한 설정

### 1. AWS 리전 설정
- **사용 리전**: `us-west-2` (Oregon)
- **모델 ID**: `us.anthropic.claude-3-5-sonnet-20241022-v2:0`

### 2. IAM 권한 설정

다음 권한이 필요합니다:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:InvokeModel",
                "bedrock:InvokeModelWithResponseStream"
            ],
            "Resource": [
                "arn:aws:bedrock:us-west-2::foundation-model/us.anthropic.claude-3-5-sonnet-20241022-v2:0"
            ]
        }
    ]
}
```

### 3. Bedrock 모델 액세스 활성화

1. AWS Console → Amazon Bedrock 서비스 접속
2. 좌측 메뉴에서 "Model access" 선택
3. "Manage model access" 클릭
4. "Anthropic" 섹션에서 "Claude 3.5 Sonnet" 체크
5. "Save changes" 클릭

### 4. 환경 변수 설정

`.env` 파일에 다음 변수들이 설정되어 있는지 확인:

```env
# AWS Bedrock 설정 (AI 분석용)
REACT_APP_AWS_ACCESS_KEY_ID=your_access_key_here
REACT_APP_AWS_SECRET_ACCESS_KEY=your_secret_key_here
REACT_APP_BEDROCK_REGION=us-west-2
```

## 🚀 AI 기능 사용법

### 1. 관리자 대시보드 접속
- http://localhost:3000/admin

### 2. AI 분석 모드 활성화
- 상단의 "AI 분석" 토글 스위치를 ON으로 설정

### 3. AI 리포트 생성
- **🤖 AI 리포트 PDF**: 전체 데이터에 대한 AI 인사이트 포함
- **🤖 AI 분석 PDF**: 각 탭별 AI 분석 리포트

## 📊 AI 분석 기능

### 전체 분석 리포트
- 데이터 패턴 및 트렌드 분석
- 핵심 인사이트 도출
- 성과 분석 및 개선 방안
- 우선순위별 액션 아이템

### 콘텐츠 분석
- 인기 콘텐츠의 성공 요인 분석
- 카테고리별 성과 비교
- 콘텐츠 전략 제안

### 작성자 분석
- 상위 작성자들의 성공 패턴
- 작성자 육성 방안
- 협업 촉진 전략

## 🔍 문제 해결

### 권한 오류 (AccessDeniedException)
```
❌ Bedrock 서비스에 대한 권한이 없습니다. AWS 자격 증명을 확인해주세요.
```
**해결방법**: IAM 권한 설정 확인 및 모델 액세스 활성화

### 모델 준비 오류 (ModelNotReadyException)
```
❌ 모델이 준비되지 않았습니다. 잠시 후 다시 시도해주세요.
```
**해결방법**: Bedrock 콘솔에서 모델 액세스 상태 확인

### 요청 제한 오류 (ThrottlingException)
```
❌ 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.
```
**해결방법**: 잠시 대기 후 재시도

## 💰 비용 정보

### Claude 3.5 Sonnet 가격 (us-west-2)
- **입력 토큰**: $3.00 per 1M tokens
- **출력 토큰**: $15.00 per 1M tokens

### 예상 비용 (리포트 1회 생성 시)
- **입력**: ~2,000 tokens ($0.006)
- **출력**: ~3,000 tokens ($0.045)
- **총 비용**: ~$0.051 per report

## 🔒 보안 고려사항

1. **데이터 프라이버시**: 분석 데이터는 AI 모델 학습에 사용되지 않음
2. **전송 암호화**: 모든 API 호출은 HTTPS로 암호화
3. **액세스 제어**: IAM 권한으로 접근 제한
4. **로깅**: CloudTrail을 통한 API 호출 추적 가능

## 📞 지원

문제가 발생하거나 추가 설정이 필요한 경우:
- AWS Support 케이스 생성
- 또는 janghwan@amazon.com으로 문의

---

**설정 완료 후 AI 기반 분석 리포트를 통해 더욱 전문적인 인사이트를 얻으실 수 있습니다!** 🚀
