# AWS SES 설정 가이드

AWS Demo Factory에서 메일 발송 기능을 사용하기 위한 AWS SES 설정 방법입니다.

## 1. AWS SES 콘솔 접속

1. AWS Management Console에 로그인
2. SES (Simple Email Service) 서비스로 이동
3. 서울 리전 (ap-northeast-2) 선택

## 2. 이메일 주소 인증

### 발신 이메일 인증
1. **Verified identities** → **Create identity** 클릭
2. **Email address** 선택
3. 발신용 이메일 주소 입력 (예: noreply@your-domain.com)
4. **Create identity** 클릭
5. 해당 이메일로 온 인증 링크 클릭

### 수신 이메일 인증 (janghwan@amazon.com)
1. **Verified identities** → **Create identity** 클릭
2. **Email address** 선택
3. `janghwan@amazon.com` 입력
4. **Create identity** 클릭
5. 해당 이메일로 온 인증 링크 클릭

## 3. IAM 권한 설정

### IAM 사용자에게 SES 권한 부여
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ses:SendEmail",
                "ses:SendRawEmail"
            ],
            "Resource": "*"
        }
    ]
}
```

## 4. 환경 변수 설정

`.env` 파일에 다음 설정 추가:
```
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=ap-northeast-2
SES_FROM_EMAIL=noreply@your-domain.com
```

## 5. Sandbox 모드 해제 (선택사항)

기본적으로 SES는 Sandbox 모드로 시작됩니다:
- 인증된 이메일 주소로만 발송 가능
- 하루 200개, 초당 1개 제한

### Production 모드로 전환하려면:
1. **Account dashboard** → **Request production access** 클릭
2. 사용 사례 설명 작성
3. AWS 승인 대기 (보통 24시간 이내)

## 6. 테스트

1. 서버 재시작
2. AWS Demo Factory에서 문의 기능 테스트
3. janghwan@amazon.com에서 메일 수신 확인

## 7. 모니터링

- **Sending statistics**: 발송 통계 확인
- **Reputation metrics**: 발송 평판 모니터링
- **Suppression list**: 차단된 이메일 주소 관리

## 주의사항

1. **이메일 인증 필수**: 발신/수신 이메일 모두 인증 필요
2. **리전 설정**: SES는 리전별 서비스이므로 올바른 리전 설정 필요
3. **요금**: 1,000개당 $0.10 (매월 첫 62,000개는 무료)
4. **발송 제한**: Sandbox 모드에서는 제한이 있음

## 문제 해결

### 일반적인 오류들:

1. **MessageRejected**: 이메일 주소가 인증되지 않음
2. **SendingPausedException**: 발송이 일시 중단됨
3. **MailFromDomainNotVerifiedException**: 발신 도메인 미인증

### 해결 방법:
- 모든 이메일 주소가 인증되었는지 확인
- IAM 권한이 올바르게 설정되었는지 확인
- AWS 자격 증명이 유효한지 확인
