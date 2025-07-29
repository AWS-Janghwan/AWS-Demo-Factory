#!/bin/bash

echo "🚑 모든 서버 문제 해결 중..."

# 1. AWS Credentials 설정
echo "1️⃣ AWS Credentials 설정..."
chmod +x fix-aws-credentials.sh
./fix-aws-credentials.sh

# 2. Python 의존성 설치
echo "2️⃣ Python 의존성 설치..."
chmod +x fix-python-dependencies.sh
./fix-python-dependencies.sh

# 3. Node.js 의존성 확인
echo "3️⃣ Node.js 의존성 확인..."
if [ ! -d "node_modules" ]; then
    echo "📦 Node.js 패키지 설치 중..."
    npm install
fi

# 4. 빌드 파일 확인
echo "4️⃣ React 빌드 확인..."
if [ ! -f "build/index.html" ]; then
    echo "🏗️ React 앱 빌드 중..."
    npm run build
fi

# 5. 로그 디렉토리 생성
echo "5️⃣ 로그 디렉토리 생성..."
mkdir -p logs pids

# 6. 권한 설정
echo "6️⃣ 실행 권한 설정..."
chmod +x unified-server-manager.sh
chmod +x scripts/*.sh

echo "✅ 모든 서버 문제 해결 완료!"
echo ""
echo "🚀 이제 서버를 시작할 수 있습니다:"
echo "   ./unified-server-manager.sh start"