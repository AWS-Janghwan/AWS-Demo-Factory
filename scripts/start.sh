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

# 프로덕션 서버 시작
echo "🔄 프로덕션 서버 시작 중..."
if ./start-production.sh > server-start.log 2>&1; then
    echo "✅ 프로덕션 서버 시작 완료"
else
    echo "⚠️ 프로덕션 서버 시작 중 오류 발생"
    echo "📄 로그 파일 확인: server-start.log"
fi

# 짧은 대기 후 상태 확인
echo "⏳ 서버 초기화 대기 (30초)..."
sleep 30

# 기본 상태 확인
echo "🔍 기본 서버 상태 확인..."

# 정적 파일 서버 확인 (가장 중요)
if curl -s --max-time 10 http://localhost:3000 | grep -q "AWS Demo Factory" 2>/dev/null; then
    echo "✅ 웹 애플리케이션 정상 동작 (포트: 3000)"
else
    echo "⚠️ 웹 애플리케이션 응답 없음 - 다시 시도 중..."
    sleep 10
    if curl -s --max-time 10 http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ 웹 애플리케이션 응답 확인"
    else
        echo "❌ 웹 애플리케이션 시작 실패"
    fi
fi

echo "⏰ 완료 시간: $(date)"
echo "🎉 ApplicationStart 단계 완료!" 
