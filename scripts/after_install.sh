#!/bin/bash

echo "🔧 AfterInstall 단계 시작..."
echo "📁 현재 디렉토리: $(pwd)"
echo "⏰ 시작 시간: $(date)"

cd /data/AWS-Demo-Factory

# 1. 환경 변수 설정
echo "🌍 환경 변수 설정 중..."
cat > .env.production << 'EOF'
NODE_ENV=production
REACT_APP_API_BASE_URL=https://www.demofactory.cloud
REACT_APP_BACKEND_API_URL=https://www.demofactory.cloud:3001
REACT_APP_PDF_SERVER_URL=https://www.demofactory.cloud:5002
REACT_APP_BEDROCK_SERVER_URL=https://www.demofactory.cloud:5001
REACT_APP_COGNITO_REGION=us-west-2
REACT_APP_COGNITO_IDENTITY_POOL_ID=us-west-2:f02cd74c-db8b-4809-9f26-be7a52e880b6
REACT_APP_COGNITO_USER_POOL_ID=us-west-2_35cY0az2M
REACT_APP_COGNITO_USER_POOL_CLIENT_ID=7r2d2c8dnb245bk9r9e8f2vqev
REACT_APP_S3_BUCKET=demo-factory-storage-bucket
REACT_APP_DYNAMODB_TABLE=DemoFactoryContents
REACT_APP_DYNAMODB_REGION=us-west-2
AWS_PROFILE=default
REACT_APP_CREDENTIAL_SOURCE=local
EOF

cp .env.production .env
echo "✅ 환경 변수 설정 완료"

# 2. 기존 빌드 정리 (최소한만)
echo "🧹 기존 빌드 파일 정리 중..."
rm -rf build/
echo "✅ 기존 빌드 파일 정리 완료"

# 3. npm 패키지 설치 (최적화)
echo "📦 npm 패키지 설치 중..."

# 캐시 활용한 빠른 설치
if npm ci --include=dev --silent 2>/dev/null; then
    echo "✅ npm ci 완료"
elif npm install --silent; then
    echo "✅ npm install 완료"
else
    echo "❌ npm 설치 실패"
    exit 1
fi

# Babel 플러그인 빠른 확인
if [ ! -d "node_modules/@babel/plugin-proposal-private-property-in-object" ]; then
    npm install @babel/plugin-proposal-private-property-in-object --save-dev --silent
fi

echo "✅ npm 패키지 설치 완료"

# 4. React 앱 빌드
echo "⚛️ React 앱 빌드 중..."

# AWS 자격 증명 환경 변수 정리 (보안)
unset AWS_ACCESS_KEY_ID
unset AWS_SECRET_ACCESS_KEY

if npm run build; then
    echo "✅ React 빌드 완료"
    if [ -f "build/index.html" ]; then
        echo "✅ build/index.html 생성 확인"
    else
        echo "❌ build/index.html 생성 실패"
        exit 1
    fi
else
    echo "❌ React 빌드 실패"
    exit 1
fi

# 5. Python 환경 설정 (최소한만)
echo "🐍 Python 환경 설정 중..."
cd python-pdf-server

# 가상환경이 없는 경우만 생성
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate

# 필수 패키지만 빠르게 설치
echo "📦 Python 필수 패키지 설치 중..."
if [ -f "requirements-minimal.txt" ]; then
    pip install --quiet --no-cache-dir -r requirements-minimal.txt 2>/dev/null || pip install -r requirements-minimal.txt
else
    pip install --quiet --no-cache-dir flask flask-cors requests python-dotenv reportlab 2>/dev/null || pip install flask flask-cors requests python-dotenv reportlab
fi

# 간단한 모듈 테스트
python -c "import flask, flask_cors, requests, reportlab" 2>/dev/null && echo "✅ Python 모듈 정상" || echo "⚠️ Python 모듈 일부 누락"

cd ..

# 6. 파일 권한 설정 (최소한만)
echo "🔐 파일 권한 설정 중..."
chmod +x /data/AWS-Demo-Factory/*.sh 2>/dev/null || true
chmod +x /data/AWS-Demo-Factory/scripts/*.sh 2>/dev/null || true
touch /data/AWS-Demo-Factory/*.log 2>/dev/null || true
chmod 666 /data/AWS-Demo-Factory/*.log 2>/dev/null || true

echo "✅ 파일 권한 설정 완료"

# 7. 최종 확인
echo "🔍 최종 상태 확인..."
echo "📄 index.html: $([ -f 'build/index.html' ] && echo '존재' || echo '없음')"
echo "🐍 Python venv: $([ -d 'python-pdf-server/venv' ] && echo '존재' || echo '없음')"

echo "⏰ 완료 시간: $(date)"
echo "🎉 AfterInstall 단계 완료!"