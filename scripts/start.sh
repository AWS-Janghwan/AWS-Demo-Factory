#!/bin/bash

echo "🚀 ApplicationStart 단계 시작..."
echo "⏰ 시작 시간: $(date)"

cd /data/AWS-Demo-Factory

# 현재 디렉토리 확인
echo "📁 현재 디렉토리: $(pwd)"

# 빌드 파일 존재 확인
if [ ! -f "build/index.html" ]; then
    echo "❌ build/index.html이 없습니다. 빌드를 다시 실행합니다."
    npm run build
fi

# 통합 서버 관리자를 통한 서버 시작
echo "🚀 통합 서버 관리자로 모든 서버 시작 중..."
if ./unified-server-manager.sh start > server-start.log 2>&1; then
    echo "✅ 모든 서버 시작 완료"
else
    echo "⚠️ 서버 시작 중 오류 발생"
    echo "📄 로그 파일 확인: server-start.log"
    echo "🔄 대체 방법으로 서버 시작 시도..."
    ./fix-static-server.sh >> server-start.log 2>&1
fi

# 짧은 대기 후 상태 확인
echo "⏳ 서버 초기화 대기 (30초)..."
sleep 30

# 통합 서버 상태 확인
echo "🔍 서버 상태 확인..."
./unified-server-manager.sh status

echo "⏰ 완료 시간: $(date)"
echo "🎉 ApplicationStart 단계 완료!" 
