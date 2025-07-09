#!/bin/bash

# AWS Demo Factory 프로젝트 백업 스크립트
# 사용법: ./backup-project.sh

echo "🚀 AWS Demo Factory 프로젝트 백업 시작..."

# 백업 디렉토리 생성
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="aws-demo-factory-backup-${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

mkdir -p "${BACKUP_PATH}"

echo "📁 백업 경로: ${BACKUP_PATH}"

# 주요 소스 파일들 백업
echo "📋 소스 파일 백업 중..."
cp -r src/ "${BACKUP_PATH}/"
cp -r public/ "${BACKUP_PATH}/"

# 설정 파일들 백업
echo "⚙️ 설정 파일 백업 중..."
cp package.json "${BACKUP_PATH}/"
cp package-lock.json "${BACKUP_PATH}/" 2>/dev/null || true
cp yarn.lock "${BACKUP_PATH}/" 2>/dev/null || true
cp .gitignore "${BACKUP_PATH}/" 2>/dev/null || true
cp README.md "${BACKUP_PATH}/" 2>/dev/null || true

# 진행 상황 문서들 백업
echo "📄 문서 파일 백업 중..."
cp PROGRESS_SUMMARY.md "${BACKUP_PATH}/" 2>/dev/null || true
cp TECHNICAL_CHANGELOG.md "${BACKUP_PATH}/" 2>/dev/null || true
cp AmazonQ.md "${BACKUP_PATH}/" 2>/dev/null || true

# 스크립트 파일들 백업
echo "🔧 스크립트 파일 백업 중..."
cp start-dev.sh "${BACKUP_PATH}/" 2>/dev/null || true
cp backup-project.sh "${BACKUP_PATH}/"

# 환경 설정 파일 템플릿 생성 (.env는 보안상 제외)
echo "🔐 환경 설정 템플릿 생성 중..."
cat > "${BACKUP_PATH}/.env.template" << 'EOF'
# AWS Demo Factory 환경 변수 템플릿
# 실제 사용 시 .env 파일로 복사하고 값을 설정하세요

AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=ap-northeast-2
AWS_S3_BUCKET=aws-demo-factory

# 기타 설정
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ENV=development
EOF

# 복원 스크립트 생성
echo "🔄 복원 스크립트 생성 중..."
cat > "${BACKUP_PATH}/restore-project.sh" << 'EOF'
#!/bin/bash

# AWS Demo Factory 프로젝트 복원 스크립트
echo "🔄 AWS Demo Factory 프로젝트 복원 시작..."

# 현재 디렉토리 확인
if [ ! -f "package.json" ]; then
    echo "❌ package.json이 없습니다. 올바른 프로젝트 디렉토리에서 실행하세요."
    exit 1
fi

echo "📦 의존성 설치 중..."
npm install

echo "🔧 환경 설정 파일 확인..."
if [ ! -f ".env" ]; then
    echo "⚠️ .env 파일이 없습니다. .env.template을 참고하여 생성하세요."
    echo "cp .env.template .env"
    echo "# 그 후 .env 파일을 편집하여 실제 값을 입력하세요"
fi

echo "✅ 복원 완료!"
echo "🚀 개발 서버 시작: ./start-dev.sh 또는 npm start"
EOF

chmod +x "${BACKUP_PATH}/restore-project.sh"

# 백업 정보 파일 생성
echo "📋 백업 정보 생성 중..."
cat > "${BACKUP_PATH}/BACKUP_INFO.md" << EOF
# AWS Demo Factory 백업 정보

## 백업 생성 정보
- **백업 일시**: $(date)
- **백업 이름**: ${BACKUP_NAME}
- **백업 경로**: ${BACKUP_PATH}

## 포함된 파일들
- src/ : 소스 코드
- public/ : 정적 파일들
- package.json : 의존성 정보
- 문서 파일들 (README.md, PROGRESS_SUMMARY.md 등)
- 스크립트 파일들

## 복원 방법
1. 새로운 디렉토리에 백업 파일들 복사
2. 복원 스크립트 실행: \`./restore-project.sh\`
3. 환경 변수 설정: \`.env.template\`을 참고하여 \`.env\` 파일 생성
4. 개발 서버 시작: \`./start-dev.sh\`

## 주의사항
- .env 파일은 보안상 백업에서 제외됨
- node_modules는 백업에서 제외됨 (npm install로 재설치)
- 로컬 데이터베이스 파일들은 별도 백업 필요

## 연락처
- 프로젝트 관련 문의: janghwan@amazon.com
EOF

# 압축 파일 생성 (선택사항)
echo "🗜️ 압축 파일 생성 중..."
cd "${BACKUP_DIR}"
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}/"
cd ..

echo "✅ 백업 완료!"
echo "📁 백업 위치: ${BACKUP_PATH}"
echo "🗜️ 압축 파일: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
echo ""
echo "📋 백업에 포함된 내용:"
echo "   - 소스 코드 (src/, public/)"
echo "   - 설정 파일 (package.json 등)"
echo "   - 문서 파일 (진행 상황, 기술 변경사항)"
echo "   - 복원 스크립트"
echo ""
echo "🔄 복원 방법:"
echo "   1. 백업 디렉토리로 이동: cd ${BACKUP_PATH}"
echo "   2. 복원 스크립트 실행: ./restore-project.sh"
echo "   3. 환경 변수 설정: .env 파일 생성"
echo "   4. 개발 서버 시작: ./start-dev.sh"
