# 🔒 보안 가이드

## ⚠️ 중요한 보안 주의사항

### 🚨 **환경 변수 보안**

#### **절대 하지 말아야 할 것들**:
- ❌ `.env` 파일을 Git에 커밋
- ❌ AWS 액세스 키를 코드에 하드코딩
- ❌ 프로덕션 키를 개발 환경에서 사용
- ❌ 공개 저장소에 민감한 정보 노출

#### **반드시 해야 할 것들**:
- ✅ `.env.example`을 복사하여 `.env` 생성
- ✅ 실제 값으로 교체 후 사용
- ✅ `.gitignore`에 `.env` 포함 확인
- ✅ 정기적인 액세스 키 로테이션

### 🔐 **AWS 보안 모범 사례**

#### **1. IAM 역할 사용 (권장)**
```bash
# EC2에서 실행 시 IAM 역할 사용
# 액세스 키 대신 역할 기반 인증 사용
```

#### **2. 최소 권한 원칙**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket/*",
        "arn:aws:dynamodb:region:account:table/DemoFactoryContents"
      ]
    }
  ]
}
```

#### **3. 액세스 키 관리**
```bash
# 액세스 키 생성
aws iam create-access-key --user-name demo-factory-user

# 액세스 키 비활성화
aws iam update-access-key --access-key-id AKIA... --status Inactive

# 액세스 키 삭제
aws iam delete-access-key --access-key-id AKIA... --user-name demo-factory-user
```

### 🛡️ **환경별 보안 설정**

#### **개발 환경**
```bash
# .env.development
NODE_ENV=development
REACT_APP_DEBUG_MODE=true
# 개발용 AWS 계정 사용
```

#### **스테이징 환경**
```bash
# .env.staging  
NODE_ENV=staging
REACT_APP_DEBUG_MODE=false
# 스테이징용 AWS 계정 사용
```

#### **프로덕션 환경**
```bash
# .env.production
NODE_ENV=production
REACT_APP_DEBUG_MODE=false
# 프로덕션용 AWS 계정 사용
# IAM 역할 사용 권장
```

### 🔍 **보안 점검 체크리스트**

#### **배포 전 확인사항**
- [ ] `.env` 파일이 `.gitignore`에 포함되어 있는가?
- [ ] 코드에 하드코딩된 키가 없는가?
- [ ] AWS 액세스 키가 최소 권한을 가지는가?
- [ ] 프로덕션과 개발 환경이 분리되어 있는가?
- [ ] 민감한 정보가 로그에 출력되지 않는가?

#### **정기 점검사항**
- [ ] 액세스 키 사용 현황 모니터링
- [ ] 비정상적인 API 호출 패턴 확인
- [ ] 권한 설정 재검토
- [ ] 액세스 키 로테이션 (90일마다 권장)

### 🚨 **보안 사고 대응**

#### **액세스 키 노출 시 즉시 조치**
1. **즉시 키 비활성화**
```bash
aws iam update-access-key --access-key-id EXPOSED_KEY --status Inactive
```

2. **새 키 생성**
```bash
aws iam create-access-key --user-name your-user
```

3. **애플리케이션 설정 업데이트**
4. **기존 키 삭제**
```bash
aws iam delete-access-key --access-key-id OLD_KEY --user-name your-user
```

5. **CloudTrail 로그 확인**
6. **보안팀에 보고**

### 📞 **보안 문의**

보안 관련 문제나 취약점 발견 시:
- **이메일**: security@your-domain.com
- **GitHub**: Security 탭에서 보안 이슈 보고
- **긴급상황**: 즉시 액세스 키 비활성화 후 연락

### 🔗 **참고 자료**

- [AWS 보안 모범 사례](https://docs.aws.amazon.com/security/)
- [IAM 사용자 가이드](https://docs.aws.amazon.com/iam/)
- [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/)
- [AWS CloudTrail](https://docs.aws.amazon.com/cloudtrail/)
